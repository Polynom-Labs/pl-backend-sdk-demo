export type SpendableNote = {
  amount: bigint;
  consumed?: boolean;
  status?: string;
  privateAddress?: string;
  coinNote?: { value?: string };
};

export type TransactionNoteLayout = {
  nIns: number;
  nOuts: number;
};

export function transactionNoteLayoutFromSdk(layout: {
  nIns: number;
  nOuts: number;
}): TransactionNoteLayout {
  return { nIns: layout.nIns, nOuts: layout.nOuts };
}

export function readNoteSpendAmount(record: SpendableNote): bigint {
  const coinValue = record.coinNote?.value;
  if (coinValue !== undefined && String(coinValue).trim() !== "") {
    return BigInt(String(coinValue));
  }
  return record.amount;
}

export function spendableTransferStroops(
  records: SpendableNote[],
  privateAddress: string,
  maxInputNotes: number,
): bigint {
  const amounts = records
    .filter((record) => !record.consumed && record.status !== "spent")
    .filter((record) => record.privateAddress === privateAddress)
    .filter((record) => record.coinNote)
    .map((record) => readNoteSpendAmount(record));
  amounts.sort((left, right) => {
    if (right > left) {
      return 1;
    }
    if (left > right) {
      return -1;
    }
    return 0;
  });
  return amounts
    .slice(0, maxInputNotes)
    .reduce((total: bigint, value: bigint) => total + value, 0n);
}
