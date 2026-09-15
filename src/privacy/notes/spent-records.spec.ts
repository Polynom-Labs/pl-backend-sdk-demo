import { markRecordsSpent, isNullifiersSpentError } from "./spent-records";

describe("markRecordsSpent", () => {
  it("flags consumed notes as spent so the next transfer cannot reselect them", () => {
    const spent = markRecordsSpent([
      { id: "note-1", consumed: false, status: "finalized" as const },
    ]);
    expect(spent).toEqual([{ id: "note-1", consumed: true, status: "spent" }]);
  });

  it("detects a rejection for an already-spent nullifier", () => {
    expect(
      isNullifiersSpentError({
        publicReason: "nullifiers_spent",
      }),
    ).toBe(true);
    expect(isNullifiersSpentError(new Error("infrastructure_failed"))).toBe(
      false,
    );
  });
});
