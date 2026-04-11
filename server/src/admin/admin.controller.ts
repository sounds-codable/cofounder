import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Put, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
  ) {}

  @Get('overview')
  async getOverview(@Headers('authorization') authorization?: string) {
    await this.getRequiredAdmin(authorization);
    return this.adminService.getOverview();
  }

  @Get('users')
  async searchUsers(
    @Headers('authorization') authorization?: string,
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    await this.getRequiredAdmin(authorization);
    return this.adminService.searchUsers(query, limit);
  }

  @Get('users/:userId')
  async getUserDetail(@Headers('authorization') authorization: string | undefined, @Param('userId') userId: string) {
    await this.getRequiredAdmin(authorization);
    return this.adminService.getUserDetail(userId);
  }

  @Get('compliance-logs')
  async getComplianceLogs(@Headers('authorization') authorization?: string, @Query('limit') limit?: string) {
    await this.getRequiredAdmin(authorization);
    return this.adminService.getComplianceLogs(limit);
  }

  @Get('daily-feed')
  async getDailyFeed(@Headers('authorization') authorization?: string, @Query('limit') limit?: string) {
    await this.getRequiredAdmin(authorization);
    return this.adminService.getDailyFeed(limit);
  }

  @Get('public-welfare/messages')
  async getPublicWelfareMessages(
    @Headers('authorization') authorization?: string,
    @Query('query') query?: string,
    @Query('limit') limit?: string,
    @Query('riskOnly') riskOnly?: string,
  ) {
    await this.getRequiredAdmin(authorization);
    return this.adminService.getPublicWelfareMessages(query, limit, riskOnly);
  }

  @Get('public-welfare/messages/:messageId')
  async getPublicWelfareMessageById(@Headers('authorization') authorization: string | undefined, @Param('messageId') messageId: string) {
    await this.getRequiredAdmin(authorization);
    return this.adminService.getPublicWelfareMessageById(messageId);
  }

  @Put('public-welfare/messages/:messageId')
  async updatePublicWelfareMessage(
    @Headers('authorization') authorization: string | undefined,
    @Param('messageId') messageId: string,
    @Body() body: { name?: string; contact: string; message: string; riskConfirmed?: boolean },
  ) {
    const user = await this.getRequiredAdmin(authorization);
    return this.adminService.updatePublicWelfareMessage(user.id, messageId, body);
  }

  @Delete('public-welfare/messages/:messageId')
  async deletePublicWelfareMessage(@Headers('authorization') authorization: string | undefined, @Param('messageId') messageId: string) {
    const user = await this.getRequiredAdmin(authorization);
    return this.adminService.deletePublicWelfareMessage(user.id, messageId);
  }

  private async getRequiredAdmin(authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);

    if (!user.isAdmin) {
      throw new ForbiddenException('仅管理员可访问该页面');
    }

    return user;
  }
}
