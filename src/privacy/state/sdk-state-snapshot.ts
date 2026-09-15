export const LEGACY_SNAPSHOT_ID = "default";

export function accountSnapshotId(publicKey: string): string {
  return `account:${publicKey}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function filterMapByOwner(
  map: unknown,
  owner: string,
): Record<string, unknown> {
  if (!isRecord(map)) {
    return {};
  }
  const prefix = `${owner}:`;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(map)) {
    if (key === owner || key.startsWith(prefix)) {
      next[key] = value;
    }
  }
  return next;
}

export function partitionSdkStateTree(
  tree: Record<string, unknown>,
  owner: string,
): Record<string, unknown> {
  const records = Array.isArray(tree.privateRecords)
    ? tree.privateRecords.filter(
        (record) => isRecord(record) && record.owner === owner,
      )
    : [];
  const wallet = isRecord(tree.wallet) ? tree.wallet : {};
  const registry = isRecord(tree.registry) ? tree.registry : {};
  return {
    ...tree,
    privateRecords: records,
    wallet: {
      ...wallet,
      privateAddressScalars: filterMapByOwner(
        wallet.privateAddressScalars,
        owner,
      ),
      privateAddressRecords: filterMapByOwner(
        wallet.privateAddressRecords,
        owner,
      ),
      defaultPrivateAddressNonce: filterMapByOwner(
        wallet.defaultPrivateAddressNonce,
        owner,
      ),
    },
    registry: {
      ...registry,
      lookups: filterMapByOwner(registry.lookups, owner),
      privateAddresses: filterMapByOwner(registry.privateAddresses, owner),
      registeredAddresses: filterMapByOwner(
        registry.registeredAddresses,
        owner,
      ),
    },
  };
}

export function recordAmountStroops(record: {
  amount?: unknown;
  coinNote?: { value?: string };
}): bigint {
  const coinValue = record.coinNote?.value;
  if (coinValue !== undefined && String(coinValue).trim() !== "") {
    return BigInt(String(coinValue));
  }
  if (typeof record.amount === "bigint") {
    return record.amount;
  }
  if (typeof record.amount === "number" && Number.isFinite(record.amount)) {
    return BigInt(Math.trunc(record.amount));
  }
  if (typeof record.amount === "string" && record.amount.trim() !== "") {
    return BigInt(record.amount);
  }
  return 0n;
}

export function privateBalanceStroopsFromRecords(
  records: Array<{
    owner?: string;
    consumed?: boolean;
    status?: string;
    amount?: unknown;
    coinNote?: { value?: string };
  }>,
  owner: string,
): bigint {
  return records
    .filter(
      (record) =>
        record.owner === owner && !record.consumed && record.status !== "spent",
    )
    .reduce((total, record) => total + recordAmountStroops(record), 0n);
}
