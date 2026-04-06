import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CardTag } from './card-tag.entity';

@Entity({ name: 'tags' })
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64 })
  name!: string;

  @Index('idx_tags_normalized_name_unique', { unique: true })
  @Column({ length: 64 })
  normalizedName!: string;

  @Column({ type: 'int', default: 0 })
  usageCount!: number;

  @OneToMany(() => CardTag, (cardTag) => cardTag.tag)
  cardTags!: CardTag[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
