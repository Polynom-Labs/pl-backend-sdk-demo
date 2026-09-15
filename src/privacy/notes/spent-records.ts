export type SpendableRecord = {
  id: string;
  consumed: boolean;
  status?: "pending" | "finalized" | "spent";
};

export function markRecordsSpent<T extends SpendableRecord>(
  records: T[],
): Array<T & { consumed: true; status: "spent" }> {
  return records.map((record) => ({
    ...record,
    consumed: true,
    status: "spent" as const,
  }));
}

export function isNullifiersSpentError(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "publicReason" in error) {
    const reason = (error as { publicReason?: unknown }).publicReason;
    if (reason === "nullifiers_spent") {
      return true;
    }
  }
  return error instanceof Error && error.message.includes("nullifiers_spent");
}
