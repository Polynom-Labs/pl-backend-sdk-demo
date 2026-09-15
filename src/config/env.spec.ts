import { requireDecimalApplicationId, defaultProveWorkers } from "./env";

describe("requireDecimalApplicationId", () => {
  it("accepts association.audit_id as decimal Fr", () => {
    expect(requireDecimalApplicationId("3520878299009890")).toBe(
      "3520878299009890",
    );
  });

  it("rejects a Compliance UUID or foreignId", () => {
    expect(() =>
      requireDecimalApplicationId("b7f25daa-aeff-4f93-b33e-0cd905f0bab9"),
    ).toThrow(/decimal Fr/);
  });
});

describe("defaultProveWorkers", () => {
  it("uses at most two workers and at most one pair per two accounts", () => {
    expect(defaultProveWorkers(5)).toBe(2);
    expect(defaultProveWorkers(2)).toBe(1);
    expect(defaultProveWorkers(1)).toBe(1);
  });
});
