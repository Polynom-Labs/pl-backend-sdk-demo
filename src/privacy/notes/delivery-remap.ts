export type DeliveryRecord = {
  owner: string;
  privateAddress?: string;
  commitmentHex?: string;
  coinNote?: { value?: string };
  amount?: bigint;
};

export type DeliveryAccount = {
  publicKey: string;
  privateAddress: string;
};

export function remapRecipientOwners<T extends DeliveryRecord>(
  records: T[],
  accounts: DeliveryAccount[],
  senderPublicKey: string,
): T[] {
  return records.map((record) => {
    const privateAddress = record.privateAddress?.trim();
    if (!privateAddress) {
      return record;
    }
    const recipient = accounts.find(
      (account) => account.privateAddress === privateAddress,
    );
    if (!recipient || recipient.publicKey === senderPublicKey) {
      return record;
    }
    return { ...record, owner: recipient.publicKey };
  });
}

export function isDeliverableOutputRecord(
  record: Pick<DeliveryRecord, "privateAddress" | "commitmentHex" | "coinNote">,
): boolean {
  return Boolean(
    record.privateAddress?.trim() && record.commitmentHex && record.coinNote,
  );
}

export function amountFromCoinNote(record: DeliveryRecord): bigint {
  const value = record.coinNote?.value;
  if (value !== undefined && String(value).trim() !== "") {
    return BigInt(String(value));
  }
  return record.amount ?? 0n;
}

export function groupRecordsByOwner<T extends { owner: string }>(
  records: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const record of records) {
    const existing = grouped.get(record.owner);
    if (existing) {
      existing.push(record);
      continue;
    }
    grouped.set(record.owner, [record]);
  }
  return grouped;
}
