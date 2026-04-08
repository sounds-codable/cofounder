import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RewardAction } from '../common/enums/reward-action.enum';
import { User } from '../users/user.entity';

@Entity({ name: 'reward_transactions' })
export class RewardTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.rewardTransactions, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'enum', enum: RewardAction })
  action!: RewardAction;

  @Column({ type: 'integer' })
  points!: number;

  @Column({ type: 'varchar', length: 240 })
  description!: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  eventKey!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
