import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 创建项目
  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.role !== UserRole.PROJECT_OWNER) {
      throw new ForbiddenException('只有项目方才能发布项目');
    }

    if (!user.basicProfileCompleted) {
      throw new ForbiddenException('请先完善基础资料');
    }

    const project = this.projectRepository.create({
      ...dto,
      ownerId: userId,
      cooperationNotes:
        dto.cooperationNotes ||
        'MVP阶段不发工资，产品验证后按贡献分配股权',
    });

    return this.projectRepository.save(project);
  }

  // 获取项目列表（带筛选和分页）
  async findAll(query: {
    industry?: string;
    techNeeds?: string;
    status?: ProjectStatus;
    page?: number;
    limit?: number;
  }): Promise<{ items: Project[]; total: number; page: number; limit: number }> {
    const { industry, techNeeds, status, page = 1, limit = 10 } = query;

    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('project.status = :status', {
        status: status || ProjectStatus.OPEN,
      });

    if (industry) {
      queryBuilder.andWhere('project.industry = :industry', { industry });
    }

    if (techNeeds) {
      queryBuilder.andWhere('project.techNeeds LIKE :techNeeds', {
        techNeeds: `%${techNeeds}%`,
      });
    }

    queryBuilder
      .orderBy('project.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    // 隐藏项目方敏感信息
    const safeItems = items.map((item) => ({
      ...item,
      owner: item.owner
        ? {
            id: item.owner.id,
            nickname: item.owner.nickname,
            avatar: item.owner.avatar,
            industry: item.owner.industry,
            industryExperience: item.owner.industryExperience,
            bio: item.owner.bio,
          }
        : null,
    }));

    return { items: safeItems as Project[], total, page, limit };
  }

  // 获取项目详情
  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 隐藏项目方敏感信息
    if (project.owner) {
      const { realName, phone, wechat, ...safeOwner } = project.owner;
      project.owner = safeOwner as User;
    }

    return project;
  }

  // 更新项目
  async update(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('只能编辑自己的项目');
    }

    Object.assign(project, dto);
    return this.projectRepository.save(project);
  }

  // 关闭项目招募
  async close(userId: string, projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('只能操作自己的项目');
    }

    project.status = ProjectStatus.CLOSED;
    return this.projectRepository.save(project);
  }

  // 获取我发布的项目
  async findMyProjects(userId: string): Promise<Project[]> {
    return this.projectRepository.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  // 增加申请人数
  async incrementApplicationCount(projectId: string): Promise<void> {
    await this.projectRepository.increment({ id: projectId }, 'applicationCount', 1);
  }
}

