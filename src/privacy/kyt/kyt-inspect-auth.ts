export function kytInspectAuthorization(
  inspectToken?: string,
): { inspectAuthorization: string } | Record<string, never> {
  const token = inspectToken?.trim();
  return token ? { inspectAuthorization: token } : {};
}
