import {
  spendableTransferStroops,
  transactionNoteLayoutFromSdk,
} from "./spendable-notes";

const threeNotes = [
  {
    amount: 3n,
    privateAddress: "stpl1a",
    coinNote: { value: "30000000" },
  },
  {
    amount: 2n,
    privateAddress: "stpl1a",
    coinNote: { value: "20000000" },
  },
  {
    amount: 1n,
    privateAddress: "stpl1a",
    coinNote: { value: "10000000" },
  },
];

describe("spendableTransferStroops", () => {
  it("sums at most two spendable notes for a 2x2 layout", () => {
    expect(spendableTransferStroops(threeNotes, "stpl1a", 2)).toBe(50000000n);
  });

  it("sums up to six spendable notes for a 6x6 layout", () => {
    expect(spendableTransferStroops(threeNotes, "stpl1a", 6)).toBe(60000000n);
  });

  it("ignores notes without a coin note or for another address", () => {
    expect(
      spendableTransferStroops(
        [
          { amount: 10n, privateAddress: "stpl1a" },
          {
            amount: 4n,
            privateAddress: "stpl1b",
            coinNote: { value: "4" },
          },
        ],
        "stpl1a",
        6,
      ),
    ).toBe(0n);
  });
});

describe("transactionNoteLayoutFromSdk", () => {
  it("copies nIns and nOuts from the SDK layout", () => {
    expect(transactionNoteLayoutFromSdk({ nIns: 6, nOuts: 6 })).toEqual({
      nIns: 6,
      nOuts: 6,
    });
  });
});
