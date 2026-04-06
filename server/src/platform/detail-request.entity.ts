import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DetailRequestStatus } from '../common/enums/detail-request-status.enum';
import { User } from '../users/user.entity';
import { Card } from './card.entity';

@Entity({ name: 'detail_requests' })
export class DetailRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.publishedRequests, { onDelete: 'CASCADE' })
  publisher!: User;

  @ManyToOne(() => User, (user) => user.requestedDetails, { onDelete: 'CASCADE' })
  requester!: User;

  @ManyToOne(() => Card, (card) => card.detailRequests, { onDelete: 'CASCADE' })
  targetCard!: Card;

  @Column({ type: 'enum', enum: DetailRequestStatus })
  status!: DetailRequestStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  publisherViewedRequesterDetailAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  contactExchangedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  exchangeReviewingAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  requesterDeclinedContactAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
