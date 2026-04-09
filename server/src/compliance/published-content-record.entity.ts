import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'published_content_records' })
export class PublishedContentRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  userEmail!: string | null;

  @Column({ type: 'uuid', nullable: true })
  cardId!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  cardSlug!: string | null;

  @Column({ type: 'varchar', length: 120 })
  operationType!: string;

  @Column({ type: 'timestamptz' })
  operationAt!: Date;

  @Column({ type: 'jsonb' })
  contentSnapshot!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
