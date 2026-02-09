import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    // 开发环境使用 console 输出，生产环境使用真实邮件
    if (this.configService.get('NODE_ENV') !== 'development') {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('MAIL_HOST'),
        port: this.configService.get('MAIL_PORT'),
        secure: true,
        auth: {
          user: this.configService.get('MAIL_USER'),
          pass: this.configService.get('MAIL_PASS'),
        },
      });
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const expiresMinutes = this.configService.get<number>('VERIFICATION_CODE_EXPIRES') || 10;

    // 开发环境直接打印验证码
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log('======================================');
      console.log(`📧 发送验证码到: ${email}`);
      console.log(`🔑 验证码: ${code}`);
      console.log(`⏰ 有效期: ${expiresMinutes}分钟`);
      console.log('======================================');
      return;
    }

    // 生产环境发送真实邮件
    const html = `
      <div style="font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563EB; font-size: 28px; margin: 0;">🤝 合伙造</h1>
          <p style="color: #64748B; font-size: 14px; margin-top: 8px;">行业专家 × 程序员 = 合伙创业</p>
        </div>
        
        <div style="background: #F8FAFC; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <p style="color: #1E293B; font-size: 16px; margin: 0 0 20px;">您好！</p>
          <p style="color: #1E293B; font-size: 16px; margin: 0 0 20px;">您正在登录合伙造平台，验证码为：</p>
          
          <div style="background: #2563EB; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          
          <p style="color: #64748B; font-size: 14px; margin: 20px 0 0;">
            验证码 ${expiresMinutes} 分钟内有效，请勿泄露给他人。
          </p>
        </div>
        
        <div style="text-align: center; color: #94A3B8; font-size: 12px;">
          <p>如果这不是您本人的操作，请忽略此邮件。</p>
          <p>© 2026 合伙造 - 让创业合伙更简单</p>
        </div>
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM'),
        to: email,
        subject: `【合伙造】您的登录验证码是 ${code}`,
        html,
      });
    }
  }
}

