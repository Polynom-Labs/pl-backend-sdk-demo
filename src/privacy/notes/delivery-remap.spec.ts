import {
  remapRecipientOwners,
  isDeliverableOutputRecord,
  amountFromCoinNote,
  groupRecordsByOwner,
} from "./delivery-remap";

describe("remapRecipientOwners", () => {
  it("sets recipient owner to the matching HD G-address", () => {
    const sender = "GSENDER";
    const recipient = "GRECIPIENT";
    const remapped = remapRecipientOwners(
      [
        {
          owner: sender,
          privateAddress: "stpl1recipient",
        },
        {
          owner: sender,
          privateAddress: "stpl1sender",
        },
      ],
      [
        { publicKey: sender, privateAddress: "stpl1sender" },
        { publicKey: recipient, privateAddress: "stpl1recipient" },
      ],
      sender,
    );
    expect(remapped[0]?.owner).toBe(recipient);
    expect(remapped[1]?.owner).toBe(sender);
  });

  it("keeps only notes that have a coin, commitment, and private address", () => {
    expect(
      isDeliverableOutputRecord({
        privateAddress: "stpl1a",
        commitmentHex: "aa",
        coinNote: { value: "1" },
      }),
    ).toBe(true);
    expect(
      isDeliverableOutputRecord({
        privateAddress: "stpl1a",
        commitmentHex: "aa",
      }),
    ).toBe(false);
    expect(amountFromCoinNote({ owner: "G", coinNote: { value: "12" } })).toBe(
      12n,
    );
  });

  it("groups remapped notes by owner so each client gets its own records", () => {
    const grouped = groupRecordsByOwner([
      { owner: "GSENDER", privateAddress: "stpl1s" },
      { owner: "GRECIPIENT", privateAddress: "stpl1r" },
      { owner: "GSENDER", privateAddress: "stpl1change" },
    ]);
    expect(grouped.get("GSENDER")?.map((record) => record.privateAddress)).toEqual(
      ["stpl1s", "stpl1change"],
    );
    expect(grouped.get("GRECIPIENT")?.map((record) => record.privateAddress)).toEqual(
      ["stpl1r"],
    );
  });
});
