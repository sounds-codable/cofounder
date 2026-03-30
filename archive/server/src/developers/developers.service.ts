import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class DevelopersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 获取程序员列表（带筛选和分页）
  async findAll(query: {
    techDirections?: string;
    interestedIndustries?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Partial<User>[]; total: number; page: number; limit: number }> {
    const { techDirections, interestedIndustries, page = 1, limit = 10 } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.DEVELOPER })
      .andWhere('user.basicProfileCompleted = :completed', { completed: true });

    if (techDirections) {
      queryBuilder.andWhere('user.techDirections LIKE :techDirections', {
        techDirections: `%${techDirections}%`,
      });
    }

    if (interestedIndustries) {
      queryBuilder.andWhere(
        'user.interestedIndustries LIKE :interestedIndustries',
        {
          interestedIndustries: `%${interestedIndustries}%`,
        },
      );
    }

    queryBuilder
      .orderBy('user.lastActiveAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    // 只返回公开信息
    const safeItems = items.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      techDirections: user.techDirections,
      workYears: user.workYears,
      bio: user.bio,
      projectExperience: user.projectExperience,
      city: user.city,
      interestedIndustries: user.interestedIndustries,
      weeklyHours: user.weeklyHours,
      lastActiveAt: user.lastActiveAt,
      createdAt: user.createdAt,
    }));

    return { items: safeItems, total, page, limit };
  }

  // 获取程序员详情
  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.DEVELOPER },
    });

    if (!user) {
      throw new NotFoundException('程序员不存在');
    }

    // 返回基础公开信息
    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      techDirections: user.techDirections,
      workYears: user.workYears,
      bio: user.bio,
      projectExperience: user.projectExperience,
      city: user.city,
      employmentStatus: user.employmentStatus,
      interestedIndustries: user.interestedIndustries,
      weeklyHours: user.weeklyHours,
      // 如果已完善详细资料，显示部分详细信息
      ...(user.detailProfileCompleted && {
        techStack: user.techStack,
        github: user.github,
        detailedProjects: user.detailedProjects,
        education: user.education,
      }),
      lastActiveAt: user.lastActiveAt,
      createdAt: user.createdAt,
    };
  }

  // 获取程序员完整联系方式（需要双方都完善详细资料）
  async getContactInfo(
    developerId: string,
    requesterId: string,
    requesterDetailCompleted: boolean,
  ): Promise<Partial<User> | null> {
    if (!requesterDetailCompleted) {
      return null;
    }

    const developer = await this.userRepository.findOne({
      where: { id: developerId, role: UserRole.DEVELOPER },
    });

    if (!developer || !developer.detailProfileCompleted) {
      return null;
    }

    return {
      realName: developer.realName,
      phone: developer.phone,
      wechat: developer.wechat,
      city: developer.city,
    };
  }
}

