import { Controller, ForbiddenException, Get, Headers, Param, Query } from '@nestjs/common';
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

  private async getRequiredAdmin(authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);

    if (!user.isAdmin) {
      throw new ForbiddenException('仅管理员可访问该页面');
    }

    return user;
  }
}
