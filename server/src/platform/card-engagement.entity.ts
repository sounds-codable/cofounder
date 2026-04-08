import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CardEngagementType } from '../common/enums/card-engagement-type.enum';
import { User } from '../users/user.entity';
import { Card } from './card.entity';

@Entity({ name: 'card_engagements' })
@Index('uq_card_engagement_user_card_type', ['user', 'card', 'type'], { unique: true })
export class CardEngagement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.cardEngagements, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Card, (card) => card.engagements, { onDelete: 'CASCADE' })
  card!: Card;

  @Column({ type: 'enum', enum: CardEngagementType })
  type!: CardEngagementType;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  firstActivatedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
