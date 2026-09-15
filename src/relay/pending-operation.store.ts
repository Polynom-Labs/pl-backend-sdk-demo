import type { Repository } from "typeorm";
import type { PendingPrivateOperation } from "@arcanetech/privacy-sdk-relay";
import { PendingPrivateOperationEntity } from "../persistence/pending-operation.entity";

export class PendingOperationStore {
  constructor(
    private readonly repo: Repository<PendingPrivateOperationEntity>,
  ) {}

  async save(operation: PendingPrivateOperation): Promise<void> {
    await this.repo.save({
      id: operation.id,
      walletPublicKey: operation.walletPublicKey,
      payload: operation as unknown as Record<string, unknown>,
    });
  }

  async list(walletPublicKey: string): Promise<PendingPrivateOperation[]> {
    const rows = await this.repo.findBy({ walletPublicKey });
    return rows.map((row) => row.payload as unknown as PendingPrivateOperation);
  }

  async read(input: {
    walletPublicKey: string;
    operationId: string;
  }): Promise<PendingPrivateOperation | undefined> {
    const row = await this.repo.findOneBy({
      id: input.operationId,
      walletPublicKey: input.walletPublicKey,
    });
    return row
      ? (row.payload as unknown as PendingPrivateOperation)
      : undefined;
  }
}
