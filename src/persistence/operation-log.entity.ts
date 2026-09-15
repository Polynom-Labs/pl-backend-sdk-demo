import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'operation_logs' })
export class OperationLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz' })
  at!: Date;

  @Column('text')
  kind!: string;

  @Column('text')
  message!: string;

  @Column({ type: 'text', nullable: true })
  fromAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  toAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  amountStroops!: string | null;

  @Column({ type: 'text', nullable: true })
  txId!: string | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}
