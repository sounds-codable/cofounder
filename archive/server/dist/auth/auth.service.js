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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const verification_code_entity_1 = require("./entities/verification-code.entity");
const user_entity_1 = require("../users/entities/user.entity");
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    verificationCodeRepository;
    userRepository;
    jwtService;
    configService;
    mailService;
    constructor(verificationCodeRepository, userRepository, jwtService, configService, mailService) {
        this.verificationCodeRepository = verificationCodeRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
    }
    generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async sendVerificationCode(dto) {
        const { email, role } = dto;
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser && existingUser.role !== role) {
            throw new common_1.BadRequestException(`该邮箱已注册为${existingUser.role === user_entity_1.UserRole.PROJECT_OWNER ? '项目方' : '程序员'}，无法切换身份`);
        }
        const recentCode = await this.verificationCodeRepository.findOne({
            where: {
                email,
                createdAt: (0, typeorm_2.MoreThan)(new Date(Date.now() - 60 * 1000)),
            },
        });
        if (recentCode) {
            throw new common_1.BadRequestException('验证码发送过于频繁，请1分钟后重试');
        }
        const code = this.generateCode();
        const expiresMinutes = this.configService.get('VERIFICATION_CODE_EXPIRES') || 10;
        const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
        const verificationCode = this.verificationCodeRepository.create({
            email,
            code,
            expiresAt,
        });
        await this.verificationCodeRepository.save(verificationCode);
        await this.mailService.sendVerificationCode(email, code);
        return { message: '验证码已发送，请查收邮件' };
    }
    async verifyAndLogin(dto) {
        const { email, code, role } = dto;
        const verificationCode = await this.verificationCodeRepository.findOne({
            where: {
                email,
                code,
                used: false,
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (!verificationCode) {
            throw new common_1.UnauthorizedException('验证码无效或已过期');
        }
        verificationCode.used = true;
        await this.verificationCodeRepository.save(verificationCode);
        let user = await this.userRepository.findOne({ where: { email } });
        let isNewUser = false;
        if (!user) {
            user = this.userRepository.create({
                email,
                role,
            });
            await this.userRepository.save(user);
            isNewUser = true;
        }
        else {
            if (user.role !== role) {
                throw new common_1.BadRequestException(`该邮箱已注册为${user.role === user_entity_1.UserRole.PROJECT_OWNER ? '项目方' : '程序员'}，无法切换身份`);
            }
        }
        user.lastActiveAt = new Date();
        await this.userRepository.save(user);
        const payload = { sub: user.id, email: user.email, role: user.role };
        const access_token = this.jwtService.sign(payload);
        const { realName, phone, wechat, ...safeUser } = user;
        return {
            access_token,
            user: safeUser,
            isNewUser,
        };
    }
    async validateUser(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('用户不存在');
        }
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(verification_code_entity_1.VerificationCode)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map