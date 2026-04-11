import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { ReviewBlogCommentDto } from './dto/review-blog-comment.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { BlogService } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(
    private readonly authService: AuthService,
    private readonly blogService: BlogService,
  ) {}

  @Get('posts')
  async listPosts(@Headers('authorization') authorization?: string) {
    const user = await this.authService.getOptionalUserFromAuthorizationHeader(authorization);
    return this.blogService.listPosts(user);
  }

  @Get('posts/:postId')
  async getPostById(@Param('postId') postId: string, @Headers('authorization') authorization?: string) {
    const user = await this.authService.getOptionalUserFromAuthorizationHeader(authorization);
    return this.blogService.getPostById(postId, user);
  }

  @Post('posts/:postId/likes/toggle')
  async toggleLike(@Param('postId') postId: string, @Headers('authorization') authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.blogService.toggleLike(postId, user);
  }

  @Post('posts/:postId/comments')
  async createComment(
    @Param('postId') postId: string,
    @Body() body: CreateBlogCommentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.blogService.createComment(postId, user, body);
  }

  @Delete('posts/:postId/comments/:commentId')
  async deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.blogService.deleteComment(postId, commentId, user);
  }

  @Get('admin/posts')
  async adminListPosts(@Headers('authorization') authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.blogService.adminListPosts(user);
  }

  @Post('admin/posts')
  async adminCreatePost(@Body() body: CreateBlogPostDto, @Headers('authorization') authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.blogService.adminCreatePost(user, body);
  }

  @Put('admin/posts/:postId')
  async adminUpdatePost(
    @Param('postId') postId: string,
    @Body() body: UpdateBlogPostDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.blogService.adminUpdatePost(user, postId, body);
  }

  @Delete('admin/posts/:postId')
  async adminDeletePost(@Param('postId') postId: string, @Headers('authorization') authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.blogService.adminDeletePost(user, postId);
  }

  @Get('admin/comments')
  async adminListComments(@Headers('authorization') authorization?: string, @Query('status') status?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.blogService.adminListComments(user, status);
  }

  @Post('admin/comments/:commentId/review')
  async adminReviewComment(
    @Param('commentId') commentId: string,
    @Body() body: ReviewBlogCommentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.blogService.adminReviewComment(user, commentId, body);
  }
}
