import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';

@Injectable()
export class ProjectOwnersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async findOne(id: string): Promise<{
    profile: Partial<User>;
    projects: Partial<Project>[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.PROJECT_OWNER },
    });

    if (!user) {
      throw new NotFoundException('项目方不存在');
    }

    const projects = await this.projectRepository.find({
      where: { ownerId: id, status: ProjectStatus.OPEN },
      order: { createdAt: 'DESC' },
    });

    const safeProjects = projects.map((p) => ({
      id: p.id,
      title: p.title,
      industry: p.industry,
      description: p.description,
      techNeeds: p.techNeeds,
      applicationCount: p.applicationCount,
      createdAt: p.createdAt,
    }));

    return {
      profile: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        industry: user.industry,
        industryExperience: user.industryExperience,
        bio: user.bio,
        ...(user.detailProfileCompleted && {
          industryResources: user.industryResources,
          relatedExperience: user.relatedExperience,
          canProvide: user.canProvide,
          education: user.education,
        }),
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt,
      },
      projects: safeProjects,
    };
  }
}
