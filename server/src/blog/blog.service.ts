import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { ComplianceLogService } from '../compliance/compliance-log.service';
import { ContentModerationService } from '../compliance/content-moderation.service';
import { BlogComment } from './blog-comment.entity';
import type { BlogCommentStatus } from './blog-comment.entity';
import { BlogLike } from './blog-like.entity';
import { BlogPost } from './blog-post.entity';
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { ReviewBlogCommentDto } from './dto/review-blog-comment.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

type OptionalUser = Pick<User, 'id' | 'displayName' | 'email' | 'isAdmin'> | null;

@Injectable()
export class BlogService {
  constructor(
    private readonly contentModerationService: ContentModerationService,
    private readonly complianceLogService: ComplianceLogService,
    @InjectRepository(BlogPost)
    private readonly blogPostRepository: Repository<BlogPost>,
    @InjectRepository(BlogComment)
    private readonly blogCommentRepository: Repository<BlogComment>,
    @InjectRepository(BlogLike)
    private readonly blogLikeRepository: Repository<BlogLike>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async listPosts(viewer: OptionalUser) {
    const posts = await this.blogPostRepository.find({
      where: { published: true },
      order: { updatedAt: 'DESC' },
      take: 100,
    });

    const postIds = posts.map((post) => post.id);
    const [likeRows, commentRows, myLikes, authors] = await Promise.all([
      postIds.length
        ? this.blogLikeRepository
            .createQueryBuilder('like')
            .select('like.postId', 'postId')
            .addSelect('COUNT(*)::int', 'count')
            .where('like.postId IN (:...postIds)', { postIds })
            .andWhere('like.active = true')
            .groupBy('like.postId')
            .getRawMany<{ postId: string; count: string }>()
        : Promise.resolve([]),
      postIds.length
        ? this.blogCommentRepository
            .createQueryBuilder('comment')
            .select('comment.postId', 'postId')
            .addSelect('COUNT(*)::int', 'count')
            .where('comment.postId IN (:...postIds)', { postIds })
            .andWhere("comment.status = 'approved'")
            .groupBy('comment.postId')
            .getRawMany<{ postId: string; count: string }>()
        : Promise.resolve([]),
      viewer && postIds.length
        ? this.blogLikeRepository.find({
            where: {
              postId: In(postIds),
              userId: viewer.id,
              active: true,
            },
          })
        : Promise.resolve([]),
      posts.length
        ? this.userRepository.find({
            where: {
              id: In(posts.map((post) => post.authorUserId)),
            },
          })
        : Promise.resolve([]),
    ]);

    const likeCountMap = new Map(likeRows.map((row) => [row.postId, Number(row.count || '0')]));
    const commentCountMap = new Map(commentRows.map((row) => [row.postId, Number(row.count || '0')]));
    const myLikedSet = new Set(myLikes.map((item) => item.postId));
    const authorMap = new Map(authors.map((author) => [author.id, author.displayName]));

    return {
      items: posts.map((post) => ({
        id: post.id,
        title: post.title,
        summary: post.summary,
        authorDisplayName: authorMap.get(post.authorUserId) || '管理员',
        updatedAt: post.updatedAt,
        createdAt: post.createdAt,
        likeCount: likeCountMap.get(post.id) || 0,
        commentCount: commentCountMap.get(post.id) || 0,
        likedByMe: myLikedSet.has(post.id),
      })),
    };
  }

  async getPostById(postId: string, viewer: OptionalUser) {
    const post = await this.blogPostRepository.findOne({ where: { id: postId, published: true } });

    if (!post) {
      throw new NotFoundException('博客不存在或未发布');
    }

    const comments = await this.blogCommentRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });

    const visibleComments = comments.filter((comment) => {
      if (comment.status === 'approved') {
        return true;
      }

      if (!viewer) {
        return false;
      }

      return comment.authorUserId === viewer.id;
    });

    const [likeCount, myLike, author] = await Promise.all([
      this.blogLikeRepository.count({ where: { postId, active: true } }),
      viewer
        ? this.blogLikeRepository.findOne({
            where: {
              postId,
              userId: viewer.id,
              active: true,
            },
          })
        : Promise.resolve(null),
      this.userRepository.findOne({ where: { id: post.authorUserId } }),
    ]);

    return {
      id: post.id,
      title: post.title,
      summary: post.summary,
      contentMarkdown: post.contentMarkdown,
      authorDisplayName: author?.displayName || '管理员',
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likeCount,
      likedByMe: Boolean(myLike),
      comments: visibleComments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        authorDisplayName: comment.authorDisplayName,
        status: comment.status,
        createdAt: comment.createdAt,
        pendingVisibleToOwner: comment.status !== 'approved',
      })),
    };
  }

  async toggleLike(postId: string, user: Pick<User, 'id'>) {
    await this.ensurePublishedPost(postId);

    const existing = await this.blogLikeRepository.findOne({
      where: {
        postId,
        userId: user.id,
      },
    });

    if (!existing) {
      const created = this.blogLikeRepository.create({
        postId,
        userId: user.id,
        active: true,
        firstActivatedAt: new Date(),
      });
      await this.blogLikeRepository.save(created);
      return { liked: true };
    }

    existing.active = !existing.active;

    if (existing.active && !existing.firstActivatedAt) {
      existing.firstActivatedAt = new Date();
    }

    await this.blogLikeRepository.save(existing);

    return {
      liked: existing.active,
    };
  }

  async createComment(postId: string, user: Pick<User, 'id' | 'displayName' | 'email'>, body: CreateBlogCommentDto) {
    await this.ensurePublishedPost(postId);

    const moderationResult = this.contentModerationService.evaluate([{ field: 'comment', content: body.content }]);

    const comment = this.blogCommentRepository.create({
      postId,
      authorUserId: user.id,
      authorDisplayName: user.displayName,
      content: body.content.trim(),
      status: 'pending',
      reviewedByUserId: null,
      reviewedAt: null,
      riskCategories: moderationResult.categories,
      riskMatchedTerms: moderationResult.matchedTerms,
      riskLevel: moderationResult.riskLevel,
    });

    const saved = await this.blogCommentRepository.save(comment);

    await this.complianceLogService.recordPublishedContent({
      userId: user.id,
      userEmail: user.email,
      operationType: 'blog_comment',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(body.riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        postId,
        commentId: saved.id,
        content: saved.content,
        status: saved.status,
      },
    });

    return {
      id: saved.id,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  async adminListPosts(adminUser: Pick<User, 'id' | 'isAdmin'>) {
    this.ensureAdmin(adminUser);

    const posts = await this.blogPostRepository.find({
      order: { updatedAt: 'DESC' },
      take: 200,
    });

    return { items: posts };
  }

  async adminCreatePost(adminUser: Pick<User, 'id' | 'isAdmin' | 'email'>, body: CreateBlogPostDto) {
    this.ensureAdmin(adminUser);

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'blog_post',
      riskConfirmed: body.riskConfirmed,
      fields: [
        { field: 'title', content: body.title },
        { field: 'summary', content: body.summary },
        { field: 'contentMarkdown', content: body.contentMarkdown },
      ],
    });

    const post = this.blogPostRepository.create({
      title: body.title.trim(),
      summary: body.summary.trim(),
      contentMarkdown: body.contentMarkdown.trim(),
      authorUserId: adminUser.id,
      published: body.published ?? true,
    });

    const saved = await this.blogPostRepository.save(post);

    await this.complianceLogService.recordPublishedContent({
      userId: adminUser.id,
      userEmail: adminUser.email || null,
      operationType: 'blog_post',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(body.riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        postId: saved.id,
        title: saved.title,
        summary: saved.summary,
        contentMarkdown: saved.contentMarkdown,
        published: saved.published,
      },
    });

    return saved;
  }

  async adminUpdatePost(adminUser: Pick<User, 'id' | 'isAdmin' | 'email'>, postId: string, body: UpdateBlogPostDto) {
    this.ensureAdmin(adminUser);

    const post = await this.blogPostRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('博客不存在');
    }

    const nextTitle = body.title?.trim() ?? post.title;
    const nextSummary = body.summary?.trim() ?? post.summary;
    const nextContentMarkdown = body.contentMarkdown?.trim() ?? post.contentMarkdown;

    const moderationResult = this.contentModerationService.ensureReviewed({
      operationType: 'blog_post',
      riskConfirmed: body.riskConfirmed,
      fields: [
        { field: 'title', content: nextTitle },
        { field: 'summary', content: nextSummary },
        { field: 'contentMarkdown', content: nextContentMarkdown },
      ],
    });

    post.title = nextTitle;
    post.summary = nextSummary;
    post.contentMarkdown = nextContentMarkdown;

    if (typeof body.published === 'boolean') {
      post.published = body.published;
    }

    const saved = await this.blogPostRepository.save(post);

    await this.complianceLogService.recordPublishedContent({
      userId: adminUser.id,
      userEmail: adminUser.email || null,
      operationType: 'blog_post',
      riskReview: {
        reviewRequired: moderationResult.hasRisk,
        riskLevel: moderationResult.riskLevel,
        categories: moderationResult.categories,
        matchedTerms: moderationResult.matchedTerms,
        confirmedToPublish: Boolean(body.riskConfirmed),
        provider: moderationResult.provider,
      },
      contentSnapshot: {
        postId: saved.id,
        title: saved.title,
        summary: saved.summary,
        contentMarkdown: saved.contentMarkdown,
        published: saved.published,
      },
    });

    return saved;
  }

  async adminDeletePost(adminUser: Pick<User, 'id' | 'isAdmin'>, postId: string) {
    this.ensureAdmin(adminUser);

    await this.blogPostRepository.delete({ id: postId });

    return { ok: true };
  }

  async adminListComments(adminUser: Pick<User, 'id' | 'isAdmin'>, status?: string) {
    this.ensureAdmin(adminUser);

    const normalizedStatus =
      status === 'pending' || status === 'approved' || status === 'rejected' ? (status as BlogCommentStatus) : undefined;

    const comments = await this.blogCommentRepository.find({
      where: normalizedStatus ? { status: normalizedStatus } : {},
      order: { createdAt: 'DESC' },
      take: 500,
    });

    const postIds = Array.from(new Set(comments.map((item) => item.postId)));
    const posts = postIds.length ? await this.blogPostRepository.find({ where: { id: In(postIds) } }) : [];
    const postMap = new Map(posts.map((post) => [post.id, post]));

    return {
      items: comments.map((comment) => ({
        id: comment.id,
        postId: comment.postId,
        postTitle: postMap.get(comment.postId)?.title || '已删除博客',
        authorDisplayName: comment.authorDisplayName,
        content: comment.content,
        status: comment.status,
        riskLevel: comment.riskLevel,
        riskCategories: comment.riskCategories || [],
        riskMatchedTerms: comment.riskMatchedTerms || [],
        createdAt: comment.createdAt,
        reviewedAt: comment.reviewedAt,
      })),
    };
  }

  async adminReviewComment(adminUser: Pick<User, 'id' | 'isAdmin'>, commentId: string, body: ReviewBlogCommentDto) {
    this.ensureAdmin(adminUser);

    const comment = await this.blogCommentRepository.findOne({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    comment.status = body.status;
    comment.reviewedByUserId = adminUser.id;
    comment.reviewedAt = new Date();

    await this.blogCommentRepository.save(comment);

    return {
      id: comment.id,
      status: comment.status,
      reviewedAt: comment.reviewedAt,
      reason: body.reason?.trim() || null,
    };
  }

  private ensureAdmin(user: Pick<User, 'isAdmin'>) {
    if (!user.isAdmin) {
      throw new ForbiddenException('仅管理员可执行该操作');
    }
  }

  private async ensurePublishedPost(postId: string) {
    const post = await this.blogPostRepository.findOne({
      where: {
        id: postId,
        published: true,
      },
    });

    if (!post) {
      throw new NotFoundException('博客不存在或未发布');
    }

    return post;
  }
}
