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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findById(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        return user;
    }
    async getProfile(userId) {
        return this.findById(userId);
    }
    async updateProjectOwnerBasicProfile(userId, dto) {
        const user = await this.findById(userId);
        if (user.role !== user_entity_1.UserRole.PROJECT_OWNER) {
            throw new common_1.ForbiddenException('只有项目方可以更新此资料');
        }
        Object.assign(user, dto);
        user.basicProfileCompleted = true;
        user.lastActiveAt = new Date();
        return this.userRepository.save(user);
    }
    async updateDeveloperBasicProfile(userId, dto) {
        const user = await this.findById(userId);
        if (user.role !== user_entity_1.UserRole.DEVELOPER) {
            throw new common_1.ForbiddenException('只有程序员可以更新此资料');
        }
        Object.assign(user, dto);
        user.basicProfileCompleted = true;
        user.lastActiveAt = new Date();
        return this.userRepository.save(user);
    }
    async updateProjectOwnerDetailProfile(userId, dto) {
        const user = await this.findById(userId);
        if (user.role !== user_entity_1.UserRole.PROJECT_OWNER) {
            throw new common_1.ForbiddenException('只有项目方可以更新此资料');
        }
        Object.assign(user, dto);
        user.detailProfileCompleted = true;
        user.lastActiveAt = new Date();
        return this.userRepository.save(user);
    }
    async updateDeveloperDetailProfile(userId, dto) {
        const user = await this.findById(userId);
        if (user.role !== user_entity_1.UserRole.DEVELOPER) {
            throw new common_1.ForbiddenException('只有程序员可以更新此资料');
        }
        Object.assign(user, dto);
        user.detailProfileCompleted = true;
        user.lastActiveAt = new Date();
        return this.userRepository.save(user);
    }
    getPublicProfile(user) {
        const { realName, phone, wechat, education, school, major, company, position, employmentStatus, workExperienceDesc, industryResources, relatedExperience, canProvide, techStack, github, detailedProjects, ...publicInfo } = user;
        return publicInfo;
    }
    getDetailedProfile(user, hideContact = true) {
        if (hideContact) {
            const { phone, wechat, ...rest } = user;
            return rest;
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map