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
type MemberKind = "method" | "get" | "set";

function createShadowTarget(implementation: object): object {
  if (typeof implementation === "function") {
    return function shadowCallable(): undefined {
      return undefined;
    };
  }
  return Object.create(null) as object;
}

function findProviderMemberOwner(
  implementation: object,
  property: PropertyKey,
): object | undefined {
  let current: object | null = implementation;
  while (current !== null) {
    if (Object.prototype.hasOwnProperty.call(current, property)) {
      return current === Object.prototype ? undefined : current;
    }
    current = Object.getPrototypeOf(current) as object | null;
  }
  return undefined;
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
    Map<PropertyKey, Map<MemberKind, (...args: readonly unknown[]) => unknown>>
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
    kind: MemberKind,
    member: Callable,
  ): (...args: readonly unknown[]) => unknown {
    let wrappers = methodWrappers.get(owner);
    if (wrappers === undefined) {
      wrappers = new Map();
      methodWrappers.set(owner, wrappers);
    }
    let members = wrappers.get(property);
    if (members === undefined) {
      members = new Map();
      wrappers.set(property, members);
    }
    const previous = members.get(kind);
    if (previous !== undefined) return previous;
    const wrapper = (...args: readonly unknown[]) =>
      fence.invoke(operationIdFor(providerId, property), () =>
        wrapResult(Reflect.apply(member, owner, args.map(unwrap))),
      );
    members.set(kind, wrapper);
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
        writable: false,
        value:
          typeof descriptor.value === "function"
            ? wrapMember(owner, property, "method", descriptor.value as Callable)
            : wrapResult(descriptor.value),
      };
    }
    return {
      configurable: true,
      enumerable: descriptor.enumerable,
      get:
        descriptor.get === undefined
          ? undefined
          : wrapMember(owner, property, "get", descriptor.get as Callable),
      // Provider state is changed through typed contract methods. Exposing a
      // setter from a projected descriptor would create a second mutation
      // authority around the read-only facade.
      set: undefined,
    };
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
        if (findProviderMemberOwner(rawValue, property) === undefined) {
          return undefined;
        }
        const member = Reflect.get(rawValue, property, rawValue);
        return typeof member === "function"
          ? wrapMember(rawValue, property, "method", member as Callable)
          : wrapResult(member);
      },
      set(_shadow, _property, _nextValue) {
        fence.assertActive();
        return false;
      },
      deleteProperty(_shadow, _property) {
        fence.assertActive();
        return false;
      },
      defineProperty(_shadow, _property, _descriptor) {
        fence.assertActive();
        return false;
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
        return (
          Reflect.has(shadow, property) ||
          findProviderMemberOwner(rawValue, property) !== undefined
        );
      },
      getPrototypeOf(shadow) {
        fence.assertActive();
        return Reflect.getPrototypeOf(shadow);
      },
      setPrototypeOf(_shadow, _prototype) {
        fence.assertActive();
        return false;
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
