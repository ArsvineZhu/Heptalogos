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

export function createFencedProxy<TContract extends object>(
  implementation: TContract,
  fence: GenerationFence,
  providerId: ProviderId,
): TContract {
  const proxies = new WeakMap<object, object>();

  const wrapResult = (value: unknown): unknown => {
    if (isPromiseLike(value)) {
      return Promise.resolve(value).then((resolved) => wrapResult(resolved));
    }
    return isProxyable(value) ? wrap(value) : value;
  };

  function wrap<T extends object>(value: T): T {
    const previous = proxies.get(value);
    if (previous !== undefined) return previous as T;

    const proxy = new Proxy(value, {
      get(target, property) {
        fence.assertActive();
        const member = Reflect.get(target, property, target);
        if (typeof member === "function") {
          return (...args: readonly unknown[]) =>
            fence.invoke(operationIdFor(providerId, property), () =>
              wrapResult(Reflect.apply(member, target, args)),
            );
        }
        return isProxyable(member) ? wrap(member) : member;
      },
      set(target, property, value) {
        fence.assertActive();
        return Reflect.set(target, property, value, target);
      },
      deleteProperty(target, property) {
        fence.assertActive();
        return Reflect.deleteProperty(target, property);
      },
      defineProperty(target, property, descriptor) {
        fence.assertActive();
        return Reflect.defineProperty(target, property, descriptor);
      },
      apply(target, thisArg, args) {
        fence.assertActive();
        return fence.invoke(operationIdFor(providerId, "<call>"), () =>
          wrapResult(
            Reflect.apply(
              target as (...callArgs: readonly unknown[]) => unknown,
              thisArg === proxy ? target : thisArg,
              args,
            ),
          ),
        );
      },
    });
    proxies.set(value, proxy);
    return proxy;
  }

  return wrap(implementation);
}
