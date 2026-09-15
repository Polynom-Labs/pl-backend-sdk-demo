import {
  installKytInspectFetchGuard,
  isNonJsonDocument,
} from "./kyt-inspect-fetch-guard";

describe("isNonJsonDocument", () => {
  it("detects XML and HTML inspect failures", () => {
    expect(isNonJsonDocument('<?xml version="1.0"?>')).toBe(true);
    expect(isNonJsonDocument("<!DOCTYPE html>")).toBe(true);
    expect(isNonJsonDocument('{"status":"approved"}')).toBe(false);
  });
});

describe("installKytInspectFetchGuard", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("rewrites XML inspect responses into JSON", async () => {
    globalThis.fetch = (async () =>
      new Response('<?xml version="1.0"?><Error/>', {
        status: 400,
        headers: { "content-type": "application/xml" },
      })) as typeof fetch;
    installKytInspectFetchGuard();
    const response = await fetch(
      "https://example.test/kyt/passages/inspect",
      { method: "POST" },
    );
    const body = (await response.json()) as { message: string };
    expect(response.status).toBe(400);
    expect(body.message).toMatch(/XML\/HTML/);
  });
});
