import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ContactMethod } from '../contacts/contact-method.entity';
import { CardEngagement } from '../platform/card-engagement.entity';
import { Card } from '../platform/card.entity';
import { DetailRequest } from '../platform/detail-request.entity';
import { RewardTransaction } from '../rewards/reward-transaction.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 160, unique: true, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 120 })
  displayName!: string;

  @Column({ type: 'jsonb', nullable: true })
  detailedProfile!: Record<string, string> | null;

  @Column({ type: 'timestamptz', nullable: true })
  detailedProfileCompletedAt!: Date | null;

  @Column({ type: 'varchar', length: 12, nullable: true })
  loginCode!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  loginCodeExpiresAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  inviteCode!: string | null;

  @Column({ type: 'uuid', nullable: true })
  invitedByUserId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  invitationAcceptedAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  isAdmin!: boolean;

  @OneToMany(() => ContactMethod, (contactMethod) => contactMethod.user)
  contactMethods!: ContactMethod[];

  @OneToMany(() => Card, (card) => card.owner)
  cards!: Card[];

  @OneToMany(() => DetailRequest, (detailRequest) => detailRequest.publisher)
  publishedRequests!: DetailRequest[];

  @OneToMany(() => DetailRequest, (detailRequest) => detailRequest.requester)
  requestedDetails!: DetailRequest[];

  @OneToMany(() => RewardTransaction, (transaction) => transaction.user)
  rewardTransactions!: RewardTransaction[];

  @OneToMany(() => CardEngagement, (engagement) => engagement.user)
  cardEngagements!: CardEngagement[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
