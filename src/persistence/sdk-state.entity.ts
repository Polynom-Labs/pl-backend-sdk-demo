import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'sdk_state' })
export class SdkStateRow {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'jsonb', default: {} })
  tree!: Record<string, unknown>;
}
