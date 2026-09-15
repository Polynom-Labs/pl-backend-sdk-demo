import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'hd_accounts' })
export class HdAccountEntity {
  @PrimaryColumn('int')
  hdIndex!: number;

  @Column('text')
  publicKey!: string;

  @Column({ type: 'text', nullable: true })
  privateAddress!: string | null;

  @Column({ type: 'boolean', default: false })
  funded!: boolean;

  @Column({ type: 'boolean', default: false })
  registered!: boolean;

  @Column({ type: 'text', default: '0' })
  sentCount!: string;

  @Column({ type: 'text', default: '0' })
  sentVolumeStroops!: string;
}
