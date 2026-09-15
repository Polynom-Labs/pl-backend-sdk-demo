import { KeyedAsyncMutex } from "./keyed-mutex";

describe("KeyedAsyncMutex", () => {
  it("runs different keys in parallel", async () => {
    const mutex = new KeyedAsyncMutex();
    let started = 0;
    let released = 0;
    let releaseA: (() => void) | undefined;
    const first = mutex.runExclusive("A", async () => {
      started += 1;
      await new Promise<void>((resolve) => {
        releaseA = resolve;
      });
    });
    const second = mutex.runExclusive("B", async () => {
      started += 1;
      released += 1;
    });
    await Promise.resolve();
    expect(started).toBe(2);
    releaseA?.();
    await Promise.all([first, second]);
    expect(released).toBe(1);
  });

  it("serializes the same key", async () => {
    const mutex = new KeyedAsyncMutex();
    const order: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const first = mutex.runExclusive("A", async () => {
      order.push("start-1");
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      order.push("end-1");
    });
    const second = mutex.runExclusive("A", async () => {
      order.push("start-2");
    });
    await Promise.resolve();
    expect(order).toEqual(["start-1"]);
    releaseFirst?.();
    await Promise.all([first, second]);
    expect(order).toEqual(["start-1", "end-1", "start-2"]);
  });

  it("acquires multiple keys in sorted order without deadlock", async () => {
    const mutex = new KeyedAsyncMutex();
    const order: string[] = [];
    await Promise.all([
      mutex.runExclusive(["B", "A"], async () => {
        order.push("ba");
      }),
      mutex.runExclusive(["A", "B"], async () => {
        order.push("ab");
      }),
    ]);
    expect(order).toHaveLength(2);
  });
});
