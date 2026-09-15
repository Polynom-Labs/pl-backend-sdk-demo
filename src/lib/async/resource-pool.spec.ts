import { ResourcePool } from "./resource-pool";

describe("ResourcePool", () => {
  it("runs jobs on distinct resources in parallel", async () => {
    const pool = new ResourcePool(["w1", "w2"]);
    let started = 0;
    let releaseFirst: (() => void) | undefined;
    const first = pool.run(async (slot) => {
      started += 1;
      expect(["w1", "w2"]).toContain(slot);
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      return slot;
    });
    await Promise.resolve();
    const second = pool.run(async (slot) => {
      started += 1;
      return slot;
    });
    await Promise.resolve();
    expect(started).toBe(2);
    releaseFirst?.();
    const results = await Promise.all([first, second]);
    expect(results.sort()).toEqual(["w1", "w2"]);
  });

  it("queues a second job while the only worker is busy", async () => {
    const pool = new ResourcePool(["only"]);
    const seen: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const first = pool.run(async () => {
      seen.push("first-start");
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      seen.push("first-end");
    });
    const second = pool.run(async () => {
      seen.push("second");
    });
    await Promise.resolve();
    expect(seen).toEqual(["first-start"]);
    expect(pool.idleCount).toBe(0);
    releaseFirst?.();
    await Promise.all([first, second]);
    expect(seen).toEqual(["first-start", "first-end", "second"]);
  });
});
