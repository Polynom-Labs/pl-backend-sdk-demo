import { kytInspectAuthorization } from "./kyt-inspect-auth";

describe("kytInspectAuthorization", () => {
  it("omits inspectAuthorization when the token is missing or blank", () => {
    expect(kytInspectAuthorization()).toEqual({});
    expect(kytInspectAuthorization("")).toEqual({});
    expect(kytInspectAuthorization("   ")).toEqual({});
  });

  it("passes inspectAuthorization only when a token is present", () => {
    expect(kytInspectAuthorization("stand-token")).toEqual({
      inspectAuthorization: "stand-token",
    });
  });
});
