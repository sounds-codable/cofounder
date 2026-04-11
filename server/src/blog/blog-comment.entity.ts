import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BlogPost } from './blog-post.entity';

export type BlogCommentStatus = 'pending' | 'approved' | 'rejected';

@Entity({ name: 'blog_comments' })
export class BlogComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  postId!: string;

  @Column({ type: 'uuid', nullable: true })
  parentCommentId!: string | null;

  @ManyToOne(() => BlogPost, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: BlogPost;

  @Column({ type: 'uuid' })
  authorUserId!: string;

  @Column({ type: 'varchar', length: 120 })
  authorDisplayName!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: BlogCommentStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  riskCategories!: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  riskMatchedTerms!: string[] | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  riskLevel!: 'none' | 'medium' | 'high' | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
