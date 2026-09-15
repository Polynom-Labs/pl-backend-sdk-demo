import {
  maxSimulatorConcurrency,
  pickDisjointTransferPair,
} from "./transfer-occupancy";

describe("transfer occupancy", () => {
  it("caps in-flight transfers by workers and available pairs", () => {
    expect(maxSimulatorConcurrency(5, 2)).toBe(2);
    expect(maxSimulatorConcurrency(2, 4)).toBe(1);
    expect(maxSimulatorConcurrency(1, 2)).toBe(1);
  });

  it("picks a free sender and a different free recipient", () => {
    const pair = pickDisjointTransferPair({
      funded: [{ id: "A" }],
      registered: [{ id: "A" }, { id: "B" }],
      busy: new Set<string>(),
      key: (account) => account.id,
    });
    expect(pair).toEqual({ sender: { id: "A" }, recipient: { id: "B" } });
  });

  it("skips accounts that are already in flight", () => {
    const pair = pickDisjointTransferPair({
      funded: [{ id: "A" }, { id: "C" }],
      registered: [{ id: "A" }, { id: "B" }, { id: "C" }],
      busy: new Set(["A"]),
      key: (account) => account.id,
    });
    expect(pair).toEqual({ sender: { id: "C" }, recipient: { id: "B" } });
  });
});
