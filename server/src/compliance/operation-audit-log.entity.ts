import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'operation_audit_logs' })
export class OperationAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  userEmail!: string | null;

  @Column({ type: 'varchar', length: 120 })
  operationType!: string;

  @Column({ type: 'varchar', length: 16 })
  requestMethod!: string;

  @Column({ type: 'varchar', length: 500 })
  requestPath!: string;

  @Column({ type: 'integer', nullable: true })
  statusCode!: number | null;

  @Column({ type: 'boolean', default: false })
  success!: boolean;

  @Column({ type: 'integer', default: 0 })
  durationMs!: number;

  @Column({ type: 'timestamptz' })
  operationAt!: Date;

  @Column({ type: 'varchar', length: 120, nullable: true })
  sourceAddress!: string | null;

  @Column({ type: 'integer', nullable: true })
  sourcePort!: number | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  destinationAddress!: string | null;

  @Column({ type: 'integer', nullable: true })
  destinationPort!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  clientHardware!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  clientFingerprint!: Record<string, string | null> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
