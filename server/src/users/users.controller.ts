import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from './entities/user.entity';
import {
  UpdateProjectOwnerBasicProfileDto,
  UpdateDeveloperBasicProfileDto,
} from './dto/update-basic-profile.dto';
import {
  UpdateProjectOwnerDetailProfileDto,
  UpdateDeveloperDetailProfileDto,
} from './dto/update-detail-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 获取当前用户资料
  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  // 更新项目方基础资料
  @Put('profile/basic/project-owner')
  @Roles(UserRole.PROJECT_OWNER)
  async updateProjectOwnerBasicProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProjectOwnerBasicProfileDto,
  ) {
    return this.usersService.updateProjectOwnerBasicProfile(user.id, dto);
  }

  // 更新程序员基础资料
  @Put('profile/basic/developer')
  @Roles(UserRole.DEVELOPER)
  async updateDeveloperBasicProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateDeveloperBasicProfileDto,
  ) {
    return this.usersService.updateDeveloperBasicProfile(user.id, dto);
  }

  // 更新项目方详细资料
  @Put('profile/detail/project-owner')
  @Roles(UserRole.PROJECT_OWNER)
  async updateProjectOwnerDetailProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProjectOwnerDetailProfileDto,
  ) {
    return this.usersService.updateProjectOwnerDetailProfile(user.id, dto);
  }

  // 更新程序员详细资料
  @Put('profile/detail/developer')
  @Roles(UserRole.DEVELOPER)
  async updateDeveloperDetailProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateDeveloperDetailProfileDto,
  ) {
    return this.usersService.updateDeveloperDetailProfile(user.id, dto);
  }
}

