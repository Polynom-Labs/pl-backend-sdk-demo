import { accountIndexForAddress } from "./dashboard-view";

describe("dashboard view helpers", () => {
  it("resolves sender and recipient HD indices from public or private addresses", () => {
    const accounts = [
      { hdIndex: 0, publicKey: "G0", privateAddress: "stpl1a" },
      { hdIndex: 2, publicKey: "G2", privateAddress: null },
    ];
    expect(accountIndexForAddress("G2", accounts)).toBe(2);
    expect(accountIndexForAddress("stpl1a", accounts)).toBe(0);
    expect(accountIndexForAddress("missing", accounts)).toBeNull();
  });
});
