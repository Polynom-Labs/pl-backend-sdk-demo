export const DEFAULT_LOG_PAGE_SIZE = 20;
export const MAX_LOG_PAGE_SIZE = 50;

export function parsePositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

export function clampLogPage(
  page: number,
  total: number,
  pageSize: number,
): number {
  const last = Math.max(1, Math.ceil(total / pageSize) || 1);
  if (page < 1) {
    return 1;
  }
  return Math.min(page, last);
}

export function logPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize) || 1);
}

export function logPageSize(value: string | undefined): number {
  return Math.min(
    MAX_LOG_PAGE_SIZE,
    parsePositiveInt(value, DEFAULT_LOG_PAGE_SIZE),
  );
}
