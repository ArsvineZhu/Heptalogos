import type { ActivityRequest } from "@heptalogos/execution-lineage";
import type { RuntimeActivityRunner } from "@heptalogos/execution-lineage/runtime-kernel";
import type { ProviderId } from "@heptalogos/foundation-contracts";
import { GenerationFence } from "./generation-fence.js";

export interface RegistryBinding<
  TDescriptor extends { readonly providerId: ProviderId },
> {
  readonly descriptor: TDescriptor;
  readonly implementation: object;
  readonly fence: GenerationFence;
  readonly runtimeActivity?: RuntimeActivityRunner;
}

export class RegistryStore<T> {
  private readonly valuesByKey = new Map<string, T>();

  get(key: string): T | undefined {
    return this.valuesByKey.get(key);
  }

  has(key: string): boolean {
    return this.valuesByKey.has(key);
  }

  set(key: string, value: T): void {
    this.valuesByKey.set(key, value);
  }

  values(): readonly T[] {
    return [...this.valuesByKey.values()];
  }

  filter(predicate: (value: T) => boolean): readonly T[] {
    return this.values().filter(predicate);
  }

  removeWhere(predicate: (value: T) => boolean): number {
    let removed = 0;
    for (const [key, value] of this.valuesByKey) {
      if (!predicate(value)) continue;
      this.valuesByKey.delete(key);
      removed += 1;
    }
    return removed;
  }

  get size(): number {
    return this.valuesByKey.size;
  }
}

export function registryProviderIds<
  TDescriptor extends { readonly providerId: ProviderId },
>(
  store: RegistryStore<RegistryBinding<TDescriptor>>,
  matches: (descriptor: TDescriptor) => boolean,
): readonly ProviderId[] {
  return store
    .filter((binding) => matches(binding.descriptor))
    .map((binding) => binding.descriptor.providerId)
    .sort();
}

export async function retireRegistryGeneration<
  T extends { readonly fence: GenerationFence },
>(
  store: RegistryStore<T>,
  fence: GenerationFence,
  settleTimeoutMs: number,
): Promise<void> {
  const removed = store.removeWhere((registration) => registration.fence === fence);
  if (removed === 0) return;
  await fence.retire(settleTimeoutMs);
}

export function activeRegistryBindings<
  T extends RegistryBinding<{ readonly providerId: ProviderId }>,
>(store: RegistryStore<T>, matches: (binding: T) => boolean): readonly T[] {
  return store.filter(
    (binding) => binding.fence.state === "ACTIVE" && matches(binding),
  );
}

export function invokeRegistryBinding<
  TDescriptor extends { readonly providerId: ProviderId },
  TResult,
>(
  binding: RegistryBinding<TDescriptor>,
  operationId: string,
  call: () => TResult | Promise<TResult>,
  activity: ActivityRequest,
): Promise<TResult> {
  const invoke = () => binding.fence.invoke(operationId, call);
  binding.fence.assertActive();
  if (binding.runtimeActivity === undefined) return Promise.resolve(invoke());
  return binding.runtimeActivity.runActivity(activity, async () => invoke());
}
