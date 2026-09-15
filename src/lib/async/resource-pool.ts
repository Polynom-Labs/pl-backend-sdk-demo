export class ResourcePool<T> {
  private readonly idle: T[];
  private readonly waiters: Array<(resource: T) => void> = [];
  readonly size: number;

  constructor(resources: T[]) {
    this.idle = [...resources];
    this.size = resources.length;
  }

  get idleCount(): number {
    return this.idle.length;
  }

  async run<R>(fn: (resource: T) => Promise<R>): Promise<R> {
    const resource = await this.acquire();
    try {
      return await fn(resource);
    } finally {
      this.release(resource);
    }
  }

  private acquire(): Promise<T> {
    const existing = this.idle.pop();
    if (existing) {
      return Promise.resolve(existing);
    }
    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }

  private release(resource: T): void {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter(resource);
      return;
    }
    this.idle.push(resource);
  }
}
