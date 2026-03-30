"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const request_entity_1 = require("./entities/request.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const user_entity_1 = require("../users/entities/user.entity");
const projects_service_1 = require("../projects/projects.service");
let RequestsService = class RequestsService {
    requestRepository;
    projectRepository;
    userRepository;
    projectsService;
    constructor(requestRepository, projectRepository, userRepository, projectsService) {
        this.requestRepository = requestRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectsService = projectsService;
    }
    async applyProject(userId, dto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || user.role !== user_entity_1.UserRole.DEVELOPER) {
            throw new common_1.ForbiddenException('只有程序员才能申请项目');
        }
        if (!user.basicProfileCompleted) {
            throw new common_1.ForbiddenException('请先完善基础资料');
        }
        const project = await this.projectRepository.findOne({
            where: { id: dto.projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        if (project.status !== project_entity_1.ProjectStatus.OPEN) {
            throw new common_1.BadRequestException('该项目已关闭招募');
        }
        const existingRequest = await this.requestRepository.findOne({
            where: {
                senderId: userId,
                projectId: dto.projectId,
                type: request_entity_1.RequestType.DEVELOPER_APPLY,
            },
        });
        if (existingRequest) {
            throw new common_1.BadRequestException('您已申请过该项目');
        }
        const request = this.requestRepository.create({
            type: request_entity_1.RequestType.DEVELOPER_APPLY,
            senderId: userId,
            receiverId: project.ownerId,
            projectId: dto.projectId,
            message: dto.message,
        });
        await this.requestRepository.save(request);
        await this.projectsService.incrementApplicationCount(dto.projectId);
        return request;
    }
    async inviteDeveloper(userId, dto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || user.role !== user_entity_1.UserRole.PROJECT_OWNER) {
            throw new common_1.ForbiddenException('只有项目方才能邀请程序员');
        }
        const project = await this.projectRepository.findOne({
            where: { id: dto.projectId, ownerId: userId },
        });
        if (!project) {
            throw new common_1.NotFoundException('项目不存在或不属于您');
        }
        if (project.status !== project_entity_1.ProjectStatus.OPEN) {
            throw new common_1.BadRequestException('该项目已关闭招募');
        }
        const developer = await this.userRepository.findOne({
            where: { id: dto.developerId, role: user_entity_1.UserRole.DEVELOPER },
        });
        if (!developer) {
            throw new common_1.NotFoundException('程序员不存在');
        }
        const existingRequest = await this.requestRepository.findOne({
            where: {
                senderId: userId,
                receiverId: dto.developerId,
                projectId: dto.projectId,
                type: request_entity_1.RequestType.OWNER_INVITE,
            },
        });
        if (existingRequest) {
            throw new common_1.BadRequestException('您已邀请过该程序员加入此项目');
        }
        const request = this.requestRepository.create({
            type: request_entity_1.RequestType.OWNER_INVITE,
            senderId: userId,
            receiverId: dto.developerId,
            projectId: dto.projectId,
            message: dto.message,
        });
        return this.requestRepository.save(request);
    }
    async acceptRequest(userId, requestId) {
        const request = await this.requestRepository.findOne({
            where: { id: requestId, receiverId: userId },
            relations: ['project'],
        });
        if (!request) {
            throw new common_1.NotFoundException('请求不存在');
        }
        if (request.status !== request_entity_1.RequestStatus.PENDING) {
            throw new common_1.BadRequestException('该请求已处理');
        }
        request.status = request_entity_1.RequestStatus.ACCEPTED;
        await this.requestRepository.save(request);
        if (request.project) {
            request.project.status = project_entity_1.ProjectStatus.MATCHED;
            await this.projectRepository.save(request.project);
        }
        return request;
    }
    async rejectRequest(userId, requestId) {
        const request = await this.requestRepository.findOne({
            where: { id: requestId, receiverId: userId },
        });
        if (!request) {
            throw new common_1.NotFoundException('请求不存在');
        }
        if (request.status !== request_entity_1.RequestStatus.PENDING) {
            throw new common_1.BadRequestException('该请求已处理');
        }
        request.status = request_entity_1.RequestStatus.REJECTED;
        return this.requestRepository.save(request);
    }
    async getReceivedRequests(userId, status) {
        const where = { receiverId: userId };
        if (status) {
            where.status = status;
        }
        return this.requestRepository.find({
            where,
            relations: ['sender', 'project'],
            order: { createdAt: 'DESC' },
        });
    }
    async getSentRequests(userId, status) {
        const where = { senderId: userId };
        if (status) {
            where.status = status;
        }
        return this.requestRepository.find({
            where,
            relations: ['receiver', 'project'],
            order: { createdAt: 'DESC' },
        });
    }
    async getContactInfo(userId, requestId) {
        const request = await this.requestRepository.findOne({
            where: { id: requestId },
            relations: ['sender', 'receiver'],
        });
        if (!request) {
            throw new common_1.NotFoundException('请求不存在');
        }
        if (request.status !== request_entity_1.RequestStatus.ACCEPTED) {
            throw new common_1.ForbiddenException('请求尚未被接受');
        }
        const isSender = request.senderId === userId;
        const isReceiver = request.receiverId === userId;
        if (!isSender && !isReceiver) {
            throw new common_1.ForbiddenException('无权查看此请求');
        }
        const currentUser = isSender ? request.sender : request.receiver;
        const targetUser = isSender ? request.receiver : request.sender;
        if (!currentUser.detailProfileCompleted) {
            throw new common_1.ForbiddenException('请先完善您的详细资料');
        }
        if (!targetUser.detailProfileCompleted) {
            return null;
        }
        return {
            realName: targetUser.realName,
            phone: targetUser.phone,
            wechat: targetUser.wechat,
            city: targetUser.city,
        };
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(request_entity_1.Request)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        projects_service_1.ProjectsService])
], RequestsService);
//# sourceMappingURL=requests.service.js.map