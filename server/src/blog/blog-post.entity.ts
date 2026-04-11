import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BlogComment } from './blog-comment.entity';
import { BlogLike } from './blog-like.entity';

@Entity({ name: 'blog_posts' })
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 220 })
  title!: string;

  @Column({ type: 'varchar', length: 400 })
  summary!: string;

  @Column({ type: 'text' })
  contentMarkdown!: string;

  @Column({ type: 'uuid' })
  authorUserId!: string;

  @Column({ type: 'boolean', default: true })
  published!: boolean;

  @OneToMany(() => BlogComment, (comment) => comment.post)
  comments!: BlogComment[];

  @OneToMany(() => BlogLike, (like) => like.post)
  likes!: BlogLike[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
