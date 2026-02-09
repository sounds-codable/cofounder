import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import {
  UpdateProjectOwnerBasicProfileDto,
  UpdateDeveloperBasicProfileDto,
} from './dto/update-basic-profile.dto';
import {
  UpdateProjectOwnerDetailProfileDto,
  UpdateDeveloperDetailProfileDto,
} from './dto/update-detail-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 获取用户信息
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  // 获取当前用户资料
  async getProfile(userId: string): Promise<User> {
    return this.findById(userId);
  }

  // 更新项目方基础资料
  async updateProjectOwnerBasicProfile(
    userId: string,
    dto: UpdateProjectOwnerBasicProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    if (user.role !== UserRole.PROJECT_OWNER) {
      throw new ForbiddenException('只有项目方可以更新此资料');
    }

    Object.assign(user, dto);
    user.basicProfileCompleted = true;
    user.lastActiveAt = new Date();

    return this.userRepository.save(user);
  }

  // 更新程序员基础资料
  async updateDeveloperBasicProfile(
    userId: string,
    dto: UpdateDeveloperBasicProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    if (user.role !== UserRole.DEVELOPER) {
      throw new ForbiddenException('只有程序员可以更新此资料');
    }

    Object.assign(user, dto);
    user.basicProfileCompleted = true;
    user.lastActiveAt = new Date();

    return this.userRepository.save(user);
  }

  // 更新项目方详细资料
  async updateProjectOwnerDetailProfile(
    userId: string,
    dto: UpdateProjectOwnerDetailProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    if (user.role !== UserRole.PROJECT_OWNER) {
      throw new ForbiddenException('只有项目方可以更新此资料');
    }

    Object.assign(user, dto);
    user.detailProfileCompleted = true;
    user.lastActiveAt = new Date();

    return this.userRepository.save(user);
  }

  // 更新程序员详细资料
  async updateDeveloperDetailProfile(
    userId: string,
    dto: UpdateDeveloperDetailProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    if (user.role !== UserRole.DEVELOPER) {
      throw new ForbiddenException('只有程序员可以更新此资料');
    }

    Object.assign(user, dto);
    user.detailProfileCompleted = true;
    user.lastActiveAt = new Date();

    return this.userRepository.save(user);
  }

  // 获取公开的用户信息（隐藏敏感字段）
  getPublicProfile(user: User): Partial<User> {
    const {
      realName,
      phone,
      wechat,
      education,
      school,
      major,
      company,
      position,
      employmentStatus,
      workExperienceDesc,
      industryResources,
      relatedExperience,
      canProvide,
      techStack,
      github,
      detailedProjects,
      ...publicInfo
    } = user;

    return publicInfo;
  }

  // 获取详细用户信息（已匹配后可见）
  getDetailedProfile(user: User, hideContact = true): Partial<User> {
    if (hideContact) {
      const { phone, wechat, ...rest } = user;
      return rest;
    }
    return user;
  }
}

