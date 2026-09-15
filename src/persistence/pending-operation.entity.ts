import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "pending_private_operations" })
export class PendingPrivateOperationEntity {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  walletPublicKey!: string;

  @Column({ type: "jsonb" })
  payload!: Record<string, unknown>;
}
