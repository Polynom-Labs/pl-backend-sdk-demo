import {
  clampLogPage,
  logPageCount,
  logPageSize,
  parsePositiveInt,
} from "./paging";

describe("operation log paging", () => {
  it("parses positive integers and falls back otherwise", () => {
    expect(parsePositiveInt("3", 1)).toBe(3);
    expect(parsePositiveInt("0", 2)).toBe(2);
    expect(parsePositiveInt("nope", 4)).toBe(4);
  });

  it("clamps log pages to the available range", () => {
    expect(clampLogPage(1, 45, 20)).toBe(1);
    expect(clampLogPage(3, 45, 20)).toBe(3);
    expect(clampLogPage(9, 45, 20)).toBe(3);
    expect(clampLogPage(0, 0, 20)).toBe(1);
  });

  it("counts log pages", () => {
    expect(logPageCount(0, 20)).toBe(1);
    expect(logPageCount(20, 20)).toBe(1);
    expect(logPageCount(21, 20)).toBe(2);
  });

  it("caps log page size", () => {
    expect(logPageSize(undefined)).toBe(20);
    expect(logPageSize("200")).toBe(50);
  });
});
