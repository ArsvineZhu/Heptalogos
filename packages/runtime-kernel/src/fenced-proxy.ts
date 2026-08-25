import type { ProviderId } from "@heptalogos/foundation-contracts";
import { GenerationFence } from "./generation-fence.js";

function operationIdFor(providerId: ProviderId, property: PropertyKey): string {
  return `${providerId}.${String(property)}`.slice(0, 256);
}

function isProxyable(value: unknown): value is object {
  return (typeof value === "object" && value !== null) || typeof value === "function";
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return isProxyable(value) && typeof (value as { then?: unknown }).then === "function";
}

type Callable = (...args: readonly unknown[]) => unknown;

function createShadowTarget(implementation: object): object {
  if (typeof implementation === "function") {
    return function shadowCallable(): undefined {
      return undefined;
    };
  }
  return Object.create(null) as object;
}

export function createFencedProxy<TContract extends object>(
  implementation: TContract,
  fence: GenerationFence,
  providerId: ProviderId,
): TContract {
  const facades = new WeakMap<object, object>();
  const rawValues = new WeakMap<object, object>();
  const methodWrappers = new WeakMap<
    object,
    Map<PropertyKey, (...args: readonly unknown[]) => unknown>
  >();

  const unwrap = (value: unknown): unknown => {
    if (!isProxyable(value)) return value;
    return rawValues.get(value) ?? value;
  };

  const wrapResult = (value: unknown): unknown => {
    if (isPromiseLike(value)) {
      return Promise.resolve(value).then((resolved) => wrapResult(resolved));
    }
    const rawValue = unwrap(value);
    return isProxyable(rawValue) ? wrap(rawValue) : rawValue;
  };

  function wrapMember(
    owner: object,
    property: PropertyKey,
    member: Callable,
  ): (...args: readonly unknown[]) => unknown {
    let wrappers = methodWrappers.get(owner);
    if (wrappers === undefined) {
      wrappers = new Map();
      methodWrappers.set(owner, wrappers);
    }
    const previous = wrappers.get(property);
    if (previous !== undefined) return previous;
    const wrapper = (...args: readonly unknown[]) =>
      fence.invoke(operationIdFor(providerId, property), () =>
        wrapResult(Reflect.apply(member, owner, args.map(unwrap))),
      );
    wrappers.set(property, wrapper);
    return wrapper;
  }

  function projectDescriptor(
    owner: object,
    target: object,
    property: PropertyKey,
  ): PropertyDescriptor | undefined {
    const shadowDescriptor = Reflect.getOwnPropertyDescriptor(target, property);
    if (shadowDescriptor !== undefined) return shadowDescriptor;
    const descriptor = Reflect.getOwnPropertyDescriptor(owner, property);
    if (descriptor === undefined) return undefined;
    if ("value" in descriptor) {
      return {
        configurable: true,
        enumerable: descriptor.enumerable,
        writable: descriptor.writable,
        value:
          typeof descriptor.value === "function"
            ? wrapMember(owner, property, descriptor.value as Callable)
            : wrapResult(descriptor.value),
      };
    }
    return {
      configurable: true,
      enumerable: descriptor.enumerable,
      get:
        descriptor.get === undefined
          ? undefined
          : wrapMember(owner, property, descriptor.get as Callable),
      set:
        descriptor.set === undefined
          ? undefined
          : wrapMember(owner, property, descriptor.set as Callable),
    };
  }

  function normalizeDescriptor(descriptor: PropertyDescriptor): PropertyDescriptor {
    const normalized = { ...descriptor };
    if (Object.prototype.hasOwnProperty.call(descriptor, "value")) {
      normalized.value = unwrap(descriptor.value);
    }
    if (descriptor.get !== undefined) {
      normalized.get = unwrap(descriptor.get) as () => unknown;
    }
    if (descriptor.set !== undefined) {
      normalized.set = unwrap(descriptor.set) as (value: unknown) => void;
    }
    return normalized;
  }

  function wrap<T extends object>(value: T): T {
    const rawValue = unwrap(value);
    if (!isProxyable(rawValue)) return rawValue as T;
    const previous = facades.get(rawValue);
    if (previous !== undefined) return previous as T;

    const target = createShadowTarget(rawValue);
    let proxy!: object;
    const handler: ProxyHandler<object> = {
      get(shadow, property) {
        fence.assertActive();
        if (Object.prototype.hasOwnProperty.call(shadow, property)) {
          return Reflect.get(shadow, property, shadow);
        }
        const member = Reflect.get(rawValue, property, rawValue);
        return typeof member === "function"
          ? wrapMember(rawValue, property, member as Callable)
          : wrapResult(member);
      },
      set(_shadow, property, nextValue) {
        fence.assertActive();
        return Reflect.set(rawValue, property, unwrap(nextValue), rawValue);
      },
      deleteProperty(_shadow, property) {
        fence.assertActive();
        return Reflect.deleteProperty(rawValue, property);
      },
      defineProperty(_shadow, property, descriptor) {
        fence.assertActive();
        return Reflect.defineProperty(
          rawValue,
          property,
          normalizeDescriptor(descriptor),
        );
      },
      getOwnPropertyDescriptor(shadow, property) {
        fence.assertActive();
        return projectDescriptor(rawValue, shadow, property);
      },
      ownKeys(shadow) {
        fence.assertActive();
        const keys = new Set<string | symbol>(Reflect.ownKeys(shadow));
        for (const key of Reflect.ownKeys(rawValue)) keys.add(key);
        return [...keys];
      },
      has(shadow, property) {
        fence.assertActive();
        return Reflect.has(shadow, property) || Reflect.has(rawValue, property);
      },
      getPrototypeOf(shadow) {
        fence.assertActive();
        return Reflect.getPrototypeOf(shadow);
      },
      setPrototypeOf(shadow, prototype) {
        fence.assertActive();
        return Reflect.setPrototypeOf(shadow, prototype);
      },
      isExtensible(shadow) {
        fence.assertActive();
        return Reflect.isExtensible(shadow);
      },
      preventExtensions() {
        fence.assertActive();
        return false;
      },
      ...(typeof rawValue === "function"
        ? {
            apply(_shadow: object, thisArg: unknown, args: readonly unknown[]) {
              fence.assertActive();
              const receiver = thisArg === proxy ? rawValue : unwrap(thisArg);
              return fence.invoke(operationIdFor(providerId, "<call>"), () =>
                wrapResult(
                  Reflect.apply(rawValue as Callable, receiver, args.map(unwrap)),
                ),
              );
            },
            construct(shadow: object, args: unknown[], newTarget: Function): object {
              fence.assertActive();
              return fence.invoke(
                operationIdFor(providerId, "<construct>"),
                () =>
                  wrapResult(
                    Reflect.construct(
                      rawValue as Function,
                      args.map(unwrap),
                      newTarget === proxy ? (shadow as Function) : newTarget,
                    ),
                  ) as object,
              ) as object;
            },
          }
        : {}),
    };
    proxy = new Proxy(target, handler);
    facades.set(rawValue, proxy);
    rawValues.set(proxy, rawValue);
    return proxy as T;
  }

  return wrap(implementation);
}
