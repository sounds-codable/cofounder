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
exports.DevelopersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
let DevelopersService = class DevelopersService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findAll(query) {
        const { techDirections, interestedIndustries, page = 1, limit = 10 } = query;
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .where('user.role = :role', { role: user_entity_1.UserRole.DEVELOPER })
            .andWhere('user.basicProfileCompleted = :completed', { completed: true });
        if (techDirections) {
            queryBuilder.andWhere('user.techDirections LIKE :techDirections', {
                techDirections: `%${techDirections}%`,
            });
        }
        if (interestedIndustries) {
            queryBuilder.andWhere('user.interestedIndustries LIKE :interestedIndustries', {
                interestedIndustries: `%${interestedIndustries}%`,
            });
        }
        queryBuilder
            .orderBy('user.lastActiveAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const [items, total] = await queryBuilder.getManyAndCount();
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
    async findOne(id) {
        const user = await this.userRepository.findOne({
            where: { id, role: user_entity_1.UserRole.DEVELOPER },
        });
        if (!user) {
            throw new common_1.NotFoundException('程序员不存在');
        }
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
    async getContactInfo(developerId, requesterId, requesterDetailCompleted) {
        if (!requesterDetailCompleted) {
            return null;
        }
        const developer = await this.userRepository.findOne({
            where: { id: developerId, role: user_entity_1.UserRole.DEVELOPER },
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
};
exports.DevelopersService = DevelopersService;
exports.DevelopersService = DevelopersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DevelopersService);
//# sourceMappingURL=developers.service.js.map