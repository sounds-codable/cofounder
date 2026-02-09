import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, RequestType, RequestStatus } from './entities/request.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ApplyProjectDto, InviteDeveloperDto } from './dto/create-request.dto';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private requestRepository: Repository<Request>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private projectsService: ProjectsService,
  ) {}

  // 程序员申请项目
  async applyProject(userId: string, dto: ApplyProjectDto): Promise<Request> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== UserRole.DEVELOPER) {
      throw new ForbiddenException('只有程序员才能申请项目');
    }

    if (!user.basicProfileCompleted) {
      throw new ForbiddenException('请先完善基础资料');
    }

    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (project.status !== ProjectStatus.OPEN) {
      throw new BadRequestException('该项目已关闭招募');
    }

    // 检查是否已申请过
    const existingRequest = await this.requestRepository.findOne({
      where: {
        senderId: userId,
        projectId: dto.projectId,
        type: RequestType.DEVELOPER_APPLY,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('您已申请过该项目');
    }

    const request = this.requestRepository.create({
      type: RequestType.DEVELOPER_APPLY,
      senderId: userId,
      receiverId: project.ownerId,
      projectId: dto.projectId,
      message: dto.message,
    });

    await this.requestRepository.save(request);

    // 增加项目申请人数
    await this.projectsService.incrementApplicationCount(dto.projectId);

    return request;
  }

  // 项目方邀请程序员
  async inviteDeveloper(userId: string, dto: InviteDeveloperDto): Promise<Request> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== UserRole.PROJECT_OWNER) {
      throw new ForbiddenException('只有项目方才能邀请程序员');
    }

    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId, ownerId: userId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或不属于您');
    }

    if (project.status !== ProjectStatus.OPEN) {
      throw new BadRequestException('该项目已关闭招募');
    }

    const developer = await this.userRepository.findOne({
      where: { id: dto.developerId, role: UserRole.DEVELOPER },
    });

    if (!developer) {
      throw new NotFoundException('程序员不存在');
    }

    // 检查是否已邀请过
    const existingRequest = await this.requestRepository.findOne({
      where: {
        senderId: userId,
        receiverId: dto.developerId,
        projectId: dto.projectId,
        type: RequestType.OWNER_INVITE,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('您已邀请过该程序员加入此项目');
    }

    const request = this.requestRepository.create({
      type: RequestType.OWNER_INVITE,
      senderId: userId,
      receiverId: dto.developerId,
      projectId: dto.projectId,
      message: dto.message,
    });

    return this.requestRepository.save(request);
  }

  // 接受请求
  async acceptRequest(userId: string, requestId: string): Promise<Request> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, receiverId: userId },
      relations: ['project'],
    });

    if (!request) {
      throw new NotFoundException('请求不存在');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('该请求已处理');
    }

    request.status = RequestStatus.ACCEPTED;
    await this.requestRepository.save(request);

    // 更新项目状态为已匹配
    if (request.project) {
      request.project.status = ProjectStatus.MATCHED;
      await this.projectRepository.save(request.project);
    }

    return request;
  }

  // 拒绝请求
  async rejectRequest(userId: string, requestId: string): Promise<Request> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, receiverId: userId },
    });

    if (!request) {
      throw new NotFoundException('请求不存在');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('该请求已处理');
    }

    request.status = RequestStatus.REJECTED;
    return this.requestRepository.save(request);
  }

  // 获取收到的请求
  async getReceivedRequests(
    userId: string,
    status?: RequestStatus,
  ): Promise<Request[]> {
    const where: any = { receiverId: userId };
    if (status) {
      where.status = status;
    }

    return this.requestRepository.find({
      where,
      relations: ['sender', 'project'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取发出的请求
  async getSentRequests(
    userId: string,
    status?: RequestStatus,
  ): Promise<Request[]> {
    const where: any = { senderId: userId };
    if (status) {
      where.status = status;
    }

    return this.requestRepository.find({
      where,
      relations: ['receiver', 'project'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取联系方式（需要双方都完善详细资料）
  async getContactInfo(
    userId: string,
    requestId: string,
  ): Promise<{ realName: string; phone: string; wechat: string; city: string } | null> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['sender', 'receiver'],
    });

    if (!request) {
      throw new NotFoundException('请求不存在');
    }

    if (request.status !== RequestStatus.ACCEPTED) {
      throw new ForbiddenException('请求尚未被接受');
    }

    // 确定要查看的是谁的联系方式
    const isSender = request.senderId === userId;
    const isReceiver = request.receiverId === userId;

    if (!isSender && !isReceiver) {
      throw new ForbiddenException('无权查看此请求');
    }

    const currentUser = isSender ? request.sender : request.receiver;
    const targetUser = isSender ? request.receiver : request.sender;

    // 检查当前用户是否已完善详细资料
    if (!currentUser.detailProfileCompleted) {
      throw new ForbiddenException('请先完善您的详细资料');
    }

    // 检查目标用户是否已完善详细资料
    if (!targetUser.detailProfileCompleted) {
      return null; // 对方尚未完善详细资料
    }

    return {
      realName: targetUser.realName,
      phone: targetUser.phone,
      wechat: targetUser.wechat,
      city: targetUser.city,
    };
  }
}

