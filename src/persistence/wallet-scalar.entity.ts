import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wallet_scalars' })
export class WalletScalarEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  owner!: string;

  @Column('text')
  privateAddress!: string;

  @Column('text')
  scalarHex!: string;
}
