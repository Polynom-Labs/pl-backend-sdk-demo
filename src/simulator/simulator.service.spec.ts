import {
  assertSimulatorReady,
  canRunSimulator,
  IntervalLoop,
  OverlappingLoop,
  isMissingPrivateRecordsError,
} from "./simulator-rules";

describe("simulator gating", () => {
  it("refuses to run without two registered accounts", () => {
    expect(canRunSimulator([])).toBe(false);
    expect(canRunSimulator([{ registered: true }])).toBe(false);
    expect(canRunSimulator([{ registered: true }, { registered: true }])).toBe(
      true,
    );
  });

  it("refuses start until setup and deposit", () => {
    expect(() => assertSimulatorReady(2, 0n)).toThrow(
      "Run setup and deposit before starting the simulator.",
    );
    expect(() => assertSimulatorReady(1, 10n)).toThrow(
      "Run setup and deposit before starting the simulator.",
    );
    expect(() => assertSimulatorReady(2, 1n)).not.toThrow();
  });

  it("treats missing private records as a skippable simulator miss", () => {
    expect(
      isMissingPrivateRecordsError(
        new Error(
          "Storage does not contain enough private records for this operation.",
        ),
      ),
    ).toBe(true);
    expect(
      isMissingPrivateRecordsError(new Error("infrastructure_failed")),
    ).toBe(false);
  });

  it("stop clears the timer", async () => {
    const loop = new IntervalLoop();
    loop.start(60_000, () => undefined);
    expect(loop.isActive()).toBe(true);
    loop.stop();
    expect(loop.isActive()).toBe(false);
  });

  it("starts the next tick as soon as the previous one finishes", async () => {
    const loop = new IntervalLoop();
    let ticks = 0;
    loop.start(15, async () => {
      ticks += 1;
      await new Promise((resolve) => {
        setTimeout(resolve, 5);
      });
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    loop.stop();
    expect(ticks).toBeGreaterThan(1);
  });

  it("starts the next overlapping tick without waiting for spawned work", async () => {
    const loop = new OverlappingLoop();
    let ticks = 0;
    loop.start(10, () => {
      ticks += 1;
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 45);
    });
    loop.stop();
    expect(ticks).toBeGreaterThan(2);
  });
});
