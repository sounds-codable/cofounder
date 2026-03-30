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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("./entities/project.entity");
const user_entity_1 = require("../users/entities/user.entity");
let ProjectsService = class ProjectsService {
    projectRepository;
    userRepository;
    constructor(projectRepository, userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }
    async create(userId, dto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        if (user.role !== user_entity_1.UserRole.PROJECT_OWNER) {
            throw new common_1.ForbiddenException('只有项目方才能发布项目');
        }
        if (!user.basicProfileCompleted) {
            throw new common_1.ForbiddenException('请先完善基础资料');
        }
        const project = this.projectRepository.create({
            ...dto,
            ownerId: userId,
            cooperationNotes: dto.cooperationNotes ||
                'MVP阶段不发工资，产品验证后按贡献分配股权',
        });
        return this.projectRepository.save(project);
    }
    async findAll(query) {
        const { industry, techNeeds, status, page = 1, limit = 10 } = query;
        const queryBuilder = this.projectRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.owner', 'owner')
            .where('project.status = :status', {
            status: status || project_entity_1.ProjectStatus.OPEN,
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
        return { items: safeItems, total, page, limit };
    }
    async findOne(id) {
        const project = await this.projectRepository.findOne({
            where: { id },
            relations: ['owner'],
        });
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        if (project.owner) {
            const { realName, phone, wechat, ...safeOwner } = project.owner;
            project.owner = safeOwner;
        }
        return project;
    }
    async update(userId, projectId, dto) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        if (project.ownerId !== userId) {
            throw new common_1.ForbiddenException('只能编辑自己的项目');
        }
        Object.assign(project, dto);
        return this.projectRepository.save(project);
    }
    async close(userId, projectId) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        if (project.ownerId !== userId) {
            throw new common_1.ForbiddenException('只能操作自己的项目');
        }
        project.status = project_entity_1.ProjectStatus.CLOSED;
        return this.projectRepository.save(project);
    }
    async findMyProjects(userId) {
        return this.projectRepository.find({
            where: { ownerId: userId },
            order: { createdAt: 'DESC' },
        });
    }
    async incrementApplicationCount(projectId) {
        await this.projectRepository.increment({ id: projectId }, 'applicationCount', 1);
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map