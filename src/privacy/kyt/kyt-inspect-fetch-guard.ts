const KYT_INSPECT_PATH = "/kyt/passages/inspect";
const originalFetch = globalThis.fetch.bind(globalThis);

function readRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

export function isNonJsonDocument(bodyText: string): boolean {
  const head = bodyText.trimStart().slice(0, 64).toLowerCase();
  return (
    head.startsWith("<?xml") ||
    head.startsWith("<!doctype") ||
    head.startsWith("<html") ||
    head.startsWith("<error")
  );
}

function buildDocumentAsJsonResponse(
  status: number,
  url: string,
  preview: string,
): Response {
  const safeStatus = status >= 400 ? status : 502;
  return new Response(
    JSON.stringify({
      message:
        `KYT inspect at ${url} returned XML/HTML instead of JSON (HTTP ${status}). ` +
        "KYT_API_BASE_URL must be the inspect API origin (same as the payment client VITE_API_BASE_URL), not the Compliance portal.",
      error: "Bad Gateway",
      statusCode: safeStatus,
      preview: preview.slice(0, 180),
    }),
    {
      status: safeStatus,
      headers: { "content-type": "application/json" },
    },
  );
}

export function installKytInspectFetchGuard(): void {
  const inner = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const response = await inner(input, init);
    const url = readRequestUrl(input);
    if (!url.includes(KYT_INSPECT_PATH)) {
      return response;
    }
    const preview = await response.clone().text();
    if (!isNonJsonDocument(preview)) {
      return response;
    }
    return buildDocumentAsJsonResponse(response.status, url, preview);
  };
}

export async function assertKytInspectLooksLikeJson(
  baseUrl: string,
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/u, "")}${KYT_INSPECT_PATH}`;
  let preview = "";
  try {
    const response = await originalFetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    preview = await response.text();
  } catch {
    return;
  }
  if (isNonJsonDocument(preview)) {
    throw new Error(
      `KYT_API_BASE_URL (${baseUrl}) is not an inspect API. ${url} returned ${preview.trimStart().slice(0, 48)}. Use the payment/audit API origin, not the Compliance portal.`,
    );
  }
}
