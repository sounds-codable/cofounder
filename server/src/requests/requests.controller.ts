import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { ApplyProjectDto, InviteDeveloperDto } from './dto/create-request.dto';
import { RequestStatus } from './entities/request.entity';

@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // 程序员申请项目
  @Post('apply')
  @Roles(UserRole.DEVELOPER)
  async applyProject(@CurrentUser() user: User, @Body() dto: ApplyProjectDto) {
    return this.requestsService.applyProject(user.id, dto);
  }

  // 项目方邀请程序员
  @Post('invite')
  @Roles(UserRole.PROJECT_OWNER)
  async inviteDeveloper(
    @CurrentUser() user: User,
    @Body() dto: InviteDeveloperDto,
  ) {
    return this.requestsService.inviteDeveloper(user.id, dto);
  }

  // 接受请求
  @Patch(':id/accept')
  async acceptRequest(@CurrentUser() user: User, @Param('id') id: string) {
    return this.requestsService.acceptRequest(user.id, id);
  }

  // 拒绝请求
  @Patch(':id/reject')
  async rejectRequest(@CurrentUser() user: User, @Param('id') id: string) {
    return this.requestsService.rejectRequest(user.id, id);
  }

  // 获取收到的请求
  @Get('received')
  async getReceivedRequests(
    @CurrentUser() user: User,
    @Query('status') status?: RequestStatus,
  ) {
    return this.requestsService.getReceivedRequests(user.id, status);
  }

  // 获取发出的请求
  @Get('sent')
  async getSentRequests(
    @CurrentUser() user: User,
    @Query('status') status?: RequestStatus,
  ) {
    return this.requestsService.getSentRequests(user.id, status);
  }

  // 获取联系方式
  @Get(':id/contact')
  async getContactInfo(@CurrentUser() user: User, @Param('id') id: string) {
    return this.requestsService.getContactInfo(user.id, id);
  }
}

