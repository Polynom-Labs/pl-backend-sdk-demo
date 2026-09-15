import type { StellarPreparedOperation } from "@arcanetech/privacy-sdk-stellar";
import type {
  ProtocolRelayPorts,
  SafeDisplayMetadata,
} from "@arcanetech/privacy-sdk-relay";
import { loadDemoEnv } from "../config/env";
import { PendingOperationStore } from "./pending-operation.store";
import { importEsm } from "../lib/esm";

export class RelaySubmitService {
  private readonly env = loadDemoEnv();

  constructor(private readonly store: PendingOperationStore) {}

  async submitPrepared(input: {
    walletPublicKey: string;
    prepared: StellarPreparedOperation;
    execute: () => Promise<{ txId: string }>;
    display: SafeDisplayMetadata;
  }): Promise<string> {
    const stellar = await importEsm<
      typeof import("@arcanetech/privacy-sdk-stellar/transact")
    >("@arcanetech/privacy-sdk-stellar/transact");
    const relay = await importEsm<
      typeof import("@arcanetech/privacy-sdk-relay")
    >("@arcanetech/privacy-sdk-relay");
    const method = stellar.requiredSubmissionMethod(
      input.prepared,
      this.env.zkConfigNonce,
    );
    if (method === "direct") {
      const receipt = await input.execute();
      return receipt.txId;
    }
    const origin = relay.resolveRelayOrigin(this.env.relayerOrigin);
    const ports: ProtocolRelayPorts = {
      store: this.store,
      submitDirect: async () => input.execute(),
      finalizeLocalState: async () => undefined,
      drainDeliveries: async () => undefined,
      persistUserTransaction: () => undefined,
      ...(origin
        ? {
            relayConfig: { origin },
            relayApi: relay.createRelayApi({ origin }),
          }
        : {}),
    };
    const outbox = input.prepared.outputRecords
      .filter(
        (record) =>
          record.privateAddress &&
          record.commitmentHex &&
          record.coinNote &&
          record.depositScalarHex,
      )
      .map((record) => ({
        recipientPrivateAddress: record.privateAddress as string,
        commitmentHex: record.commitmentHex as string,
        coinNote: { ...record.coinNote } as Record<string, string>,
        depositScalarHex: record.depositScalarHex as string,
        assetId: record.asset,
        amountDisplay: input.display.amountDisplay,
        ...(record.precommitementHex
          ? { precommitementHex: record.precommitementHex }
          : {}),
      }));
    const result = await relay.submitAndAwaitPrivateOperation({
      ports,
      operation: {
        id: crypto.randomUUID(),
        walletPublicKey: input.walletPublicKey,
        submissionPath: method,
        display: input.display,
        snapshot: {
          consumedRecordIds: input.prepared.consumedRecords.map(
            (record) => record.id,
          ),
          outputRecords: outbox,
        },
        deliveryOutbox: outbox,
        relayPackage: relay.serializeRelayPackage(
          stellar.prepareRelayTransactPackageFromPrepared({
            prepared: input.prepared,
            poolSelector: this.env.poolContract,
            zkConfigNonce: this.env.zkConfigNonce,
          }),
        ),
      },
      pollIntervalMs: 250,
      maxAttempts: 40,
    });
    const { txId } = relay.throwIfRelayUnsuccessful(result);
    return txId;
  }
}
