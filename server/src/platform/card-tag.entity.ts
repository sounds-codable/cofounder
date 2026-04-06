import { CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Card } from './card.entity';
import { Tag } from './tag.entity';

@Entity({ name: 'card_tags' })
@Unique('uq_card_tags_card_tag', ['card', 'tag'])
@Index('idx_card_tags_card', ['card'])
@Index('idx_card_tags_tag', ['tag'])
export class CardTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Card, (card) => card.cardTags, { onDelete: 'CASCADE' })
  card!: Card;

  @ManyToOne(() => Tag, (tag) => tag.cardTags, { onDelete: 'CASCADE' })
  tag!: Tag;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
