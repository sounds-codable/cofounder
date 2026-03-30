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
exports.ProjectOwnersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const project_entity_1 = require("../projects/entities/project.entity");
let ProjectOwnersService = class ProjectOwnersService {
    userRepository;
    projectRepository;
    constructor(userRepository, projectRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({
            where: { id, role: user_entity_1.UserRole.PROJECT_OWNER },
        });
        if (!user) {
            throw new common_1.NotFoundException('项目方不存在');
        }
        const projects = await this.projectRepository.find({
            where: { ownerId: id, status: project_entity_1.ProjectStatus.OPEN },
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
};
exports.ProjectOwnersService = ProjectOwnersService;
exports.ProjectOwnersService = ProjectOwnersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProjectOwnersService);
//# sourceMappingURL=project-owners.service.js.map