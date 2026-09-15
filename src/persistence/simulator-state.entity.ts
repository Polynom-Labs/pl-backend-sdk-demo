import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'simulator_state' })
export class SimulatorStateEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { default: 'stopped' })
  status!: 'running' | 'stopped';

  @Column({ type: 'text', default: '0' })
  transactionCount!: string;

  @Column({ type: 'text', default: '0' })
  totalVolumeStroops!: string;

  @Column({ type: 'int', default: 2 })
  transactionsPerMinute!: number;

  @Column({ type: 'text', default: '1' })
  minAmountXlm!: string;

  @Column({ type: 'text', default: '1' })
  maxAmountXlm!: string;
}
