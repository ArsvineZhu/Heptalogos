export class KeyedAsyncSerializer {
  private readonly tails = new Map<string, Promise<void>>();

  run<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    const current = previous.then(operation, operation);
    const barrier = current.then(
      () => undefined,
      () => undefined,
    );
    this.tails.set(key, barrier);
    return current.finally(() => {
      if (this.tails.get(key) === barrier) this.tails.delete(key);
    });
  }
}
