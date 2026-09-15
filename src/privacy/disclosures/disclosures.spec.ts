import {
  DEPOSIT_DISCLOSURE,
  PRIVATE_TRANSFER_DISCLOSURE,
  PUBLIC_WITHDRAW_DISCLOSURE,
} from "./disclosures";

describe("operation disclosures", () => {
  it("matches the payment-client Stellar routes", () => {
    expect(DEPOSIT_DISCLOSURE).toEqual({
      senderAddress: "public",
      recipientAddress: "private",
      assetAddress: "public",
      amount: "public",
    });
    expect(PRIVATE_TRANSFER_DISCLOSURE).toEqual({
      senderAddress: "private",
      recipientAddress: "private",
      assetAddress: "private",
      amount: "private",
    });
    expect(PUBLIC_WITHDRAW_DISCLOSURE).toEqual({
      senderAddress: "private",
      recipientAddress: "public",
      assetAddress: "public",
      amount: "public",
    });
  });
});
