"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = class MailService {
    configService;
    transporter = null;
    constructor(configService) {
        this.configService = configService;
        if (this.configService.get('NODE_ENV') !== 'development') {
            const host = this.configService.get('MAIL_HOST');
            const portRaw = this.configService.get('MAIL_PORT');
            const port = typeof portRaw === 'string' ? Number(portRaw) : portRaw;
            const user = this.configService.get('MAIL_USER') ||
                this.configService.get('MAIL_USERNAME');
            const pass = this.configService.get('MAIL_PASS') ||
                this.configService.get('MAIL_PASSWORD');
            const encryption = this.configService.get('MAIL_ENCRYPTION') ||
                this.configService.get('MAIL_SECURE');
            const secure = (typeof encryption === 'string' && encryption.toLowerCase() === 'ssl') ||
                port === 465;
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: {
                    user,
                    pass,
                },
            });
        }
    }
    async sendVerificationCode(email, code) {
        const expiresMinutes = this.configService.get('VERIFICATION_CODE_EXPIRES') || 10;
        if (this.configService.get('NODE_ENV') === 'development') {
            console.log('======================================');
            console.log(`📧 发送验证码到: ${email}`);
            console.log(`🔑 验证码: ${code}`);
            console.log(`⏰ 有效期: ${expiresMinutes}分钟`);
            console.log('======================================');
            return;
        }
        const html = `
      <div style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563EB; font-size: 28px; margin: 0;">🤝 叩饭（Cofounder）</h1>
          <p style="color: #64748B; font-size: 14px; margin-top: 8px;">行业专家 × 程序员 = 合伙创业</p>
        </div>
        
        <div style="background: #F8FAFC; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <p style="color: #1E293B; font-size: 16px; margin: 0 0 20px;">您好！</p>
          <p style="color: #1E293B; font-size: 16px; margin: 0 0 20px;">您正在登录叩饭（Cofounder）平台，验证码为：</p>
          
          <div style="background: #2563EB; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          
          <p style="color: #64748B; font-size: 14px; margin: 20px 0 0;">
            验证码 ${expiresMinutes} 分钟内有效，请勿泄露给他人。
          </p>
        </div>
        
        <div style="text-align: center; color: #94A3B8; font-size: 12px;">
          <p>如果这不是您本人的操作，请忽略此邮件。</p>
          <p>© 2026 叩饭（Cofounder） - 让创业合伙更简单</p>
        </div>
      </div>
    `;
        if (this.transporter) {
            const fromAddress = this.configService.get('MAIL_FROM_ADDRESS') ||
                this.configService.get('MAIL_FROM');
            const fromName = this.configService.get('MAIL_FROM_NAME');
            const from = fromName && fromAddress ? `${fromName} <${fromAddress}>` : fromAddress;
            try {
                await this.transporter.sendMail({
                    from,
                    to: email,
                    subject: `【叩饭（Cofounder）】您的登录验证码是 ${code}`,
                    html,
                });
            }
            catch (err) {
                console.error('[MailService] sendVerificationCode failed', {
                    to: email,
                    from,
                    host: this.configService.get('MAIL_HOST'),
                    port: this.configService.get('MAIL_PORT'),
                    encryption: this.configService.get('MAIL_ENCRYPTION'),
                    error: err instanceof Error ? err.message : err,
                });
                throw err;
            }
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map