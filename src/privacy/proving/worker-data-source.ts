import { DataSource } from "typeorm";
import type { DemoEnv } from "../../config/env";
import { HdAccountEntity } from "../../persistence/hd-account.entity";
import { PendingPrivateOperationEntity } from "../../persistence/pending-operation.entity";
import { SdkStateRow } from "../../persistence/sdk-state.entity";
import { WalletScalarEntity } from "../../persistence/wallet-scalar.entity";

const workerEntities = [
  SdkStateRow,
  HdAccountEntity,
  WalletScalarEntity,
  PendingPrivateOperationEntity,
];

export async function createWorkerDataSource(
  env: DemoEnv,
): Promise<DataSource> {
  const dataSource = new DataSource({
    type: "postgres",
    url: env.databaseUrl,
    entities: workerEntities,
    synchronize: false,
  });
  await dataSource.initialize();
  return dataSource;
}
