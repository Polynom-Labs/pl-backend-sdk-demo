import { AsyncMutex } from "./mutex";

export class KeyedAsyncMutex {
  private readonly locks = new Map<string, AsyncMutex>();

  runExclusive<T>(keys: string | string[], fn: () => Promise<T>): Promise<T> {
    const unique = [
      ...new Set(typeof keys === "string" ? [keys] : keys),
    ].sort();
    if (unique.length === 0) {
      return fn();
    }
    return unique.reduceRight<() => Promise<T>>(
      (next, key) => () => this.mutexFor(key).runExclusive(next),
      fn,
    )();
  }

  private mutexFor(key: string): AsyncMutex {
    const existing = this.locks.get(key);
    if (existing) {
      return existing;
    }
    const created = new AsyncMutex();
    this.locks.set(key, created);
    return created;
  }
}
