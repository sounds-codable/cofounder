import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/user.entity';
import { CardTag } from './card-tag.entity';
import { DetailRequest } from './detail-request.entity';

@Entity({ name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 160, unique: true })
  slug!: string;

  @ManyToOne(() => User, (user) => user.cards, { onDelete: 'CASCADE' })
  owner!: User;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ length: 200 })
  headline!: string;

  @Column({ length: 120 })
  city!: string;

  @Column({ type: 'text' })
  basicSummary!: string;

  @Column({ type: 'text', nullable: true })
  optionalDirection!: string | null;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  strengths!: string[];

  @Column({ type: 'jsonb' })
  detailPreview!: Record<string, string>;

  @OneToMany(() => DetailRequest, (detailRequest) => detailRequest.targetCard)
  detailRequests!: DetailRequest[];

  @OneToMany(() => CardTag, (cardTag) => cardTag.card)
  cardTags!: CardTag[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
