import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ type: 'varchar', length: 255 })
  operationType!: string;

  @Column({ type: 'boolean', default: false })
  reviewRequired!: boolean;

  @Column({ type: 'varchar', length: 16, nullable: true })
  riskLevel!: 'none' | 'medium' | 'high' | null;

  @Column({ type: 'jsonb', nullable: true })
  riskCategories!: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  riskMatchedTerms!: string[] | null;

  @Column({ type: 'boolean', default: false })
  confirmedToPublish!: boolean;

  @Column({ type: 'varchar', length: 80, nullable: true })
  moderationProvider!: string | null;

  @Column({ type: 'timestamptz' })
  operationAt!: Date;

  @Column({ type: 'jsonb' })
  contentSnapshot!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
