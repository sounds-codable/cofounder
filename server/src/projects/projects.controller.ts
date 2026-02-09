import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus } from './entities/project.entity';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // 发布项目（仅项目方）
  @Post()
  @Roles(UserRole.PROJECT_OWNER)
  async create(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.id, dto);
  }

  // 获取项目列表（公开）
  @Get()
  @Public()
  async findAll(
    @Query('industry') industry?: string,
    @Query('techNeeds') techNeeds?: string,
    @Query('status') status?: ProjectStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projectsService.findAll({
      industry,
      techNeeds,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  // 获取我发布的项目（仅项目方）
  @Get('my')
  @Roles(UserRole.PROJECT_OWNER)
  async findMyProjects(@CurrentUser() user: User) {
    return this.projectsService.findMyProjects(user.id);
  }

  // 获取项目详情（公开）
  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // 更新项目（仅项目方）
  @Put(':id')
  @Roles(UserRole.PROJECT_OWNER)
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(user.id, id, dto);
  }

  // 关闭项目招募（仅项目方）
  @Patch(':id/close')
  @Roles(UserRole.PROJECT_OWNER)
  async close(@CurrentUser() user: User, @Param('id') id: string) {
    return this.projectsService.close(user.id, id);
  }
}

