import "../../config/load-env";
import { installKytInspectFetchGuard } from "../kyt";
import { loadDemoEnv } from "../../config/env";
import { bootstrapAccountClients } from "../clients";
import { PrivacyJobRunner } from "../operations";
import { createWorkerDataSource } from "./worker-data-source";
import { PendingOperationStore } from "../../relay/pending-operation.store";
import { RelaySubmitService } from "../../relay/relay-submit.service";
import { HdAccountEntity } from "../../persistence/hd-account.entity";
import { PendingPrivateOperationEntity } from "../../persistence/pending-operation.entity";
import { SdkStateRow } from "../../persistence/sdk-state.entity";
import { WalletScalarEntity } from "../../persistence/wallet-scalar.entity";
import type { PrivacyWorkerRequest, PrivacyWorkerResponse } from "../jobs";

installKytInspectFetchGuard();

function sendToParent(message: PrivacyWorkerResponse): void {
  if (typeof process.send !== "function") {
    throw new Error("Prove worker must run as a forked process.");
  }
  process.send(message);
}

function isPrivacyWorkerRequest(value: unknown): value is PrivacyWorkerRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "id" in value && "job" in value;
}

async function main(): Promise<void> {
  if (typeof process.send !== "function") {
    throw new Error("Prove worker must run as a forked process.");
  }
  const env = loadDemoEnv();
  const dataSource = await createWorkerDataSource(env);
  const clients = await bootstrapAccountClients({
    env,
    sdkState: dataSource.getRepository(SdkStateRow),
    scalars: dataSource.getRepository(WalletScalarEntity),
  });
  const store = new PendingOperationStore(
    dataSource.getRepository(PendingPrivateOperationEntity),
  );
  const runner = new PrivacyJobRunner(
    env,
    clients,
    new RelaySubmitService(store),
    dataSource.getRepository(HdAccountEntity),
    dataSource.getRepository(WalletScalarEntity),
  );
  process.on("message", (message: unknown) => {
    if (!isPrivacyWorkerRequest(message)) {
      return;
    }
    void runner.run(message.job).then((result) => {
      sendToParent({
        type: "result",
        id: message.id,
        result,
      });
    });
  });
  sendToParent({ type: "ready" });
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Prove worker failed to start: ${message}`);
  process.exit(1);
});
