export const DEPOSIT_DISCLOSURE = {
  senderAddress: "public" as const,
  recipientAddress: "private" as const,
  assetAddress: "public" as const,
  amount: "public" as const,
};

export const PRIVATE_TRANSFER_DISCLOSURE = {
  senderAddress: "private" as const,
  recipientAddress: "private" as const,
  assetAddress: "private" as const,
  amount: "private" as const,
};

export const PUBLIC_WITHDRAW_DISCLOSURE = {
  senderAddress: "private" as const,
  recipientAddress: "public" as const,
  assetAddress: "public" as const,
  amount: "public" as const,
};
