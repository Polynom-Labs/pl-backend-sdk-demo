export type AccountIndexRow = {
  hdIndex: number;
  publicKey: string;
  privateAddress: string | null;
};

export function accountIndexForAddress(
  address: string | null,
  accounts: AccountIndexRow[],
): number | null {
  if (!address) {
    return null;
  }
  const match = accounts.find(
    (account) =>
      account.publicKey === address || account.privateAddress === address,
  );
  return match === undefined ? null : match.hdIndex;
}
