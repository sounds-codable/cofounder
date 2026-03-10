import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    // 开发环境使用 console 输出，生产环境使用真实邮件
    if (this.configService.get('NODE_ENV') !== 'development') {
      const host = this.configService.get<string>('MAIL_HOST');
      const portRaw = this.configService.get<string | number>('MAIL_PORT');
      const port = typeof portRaw === 'string' ? Number(portRaw) : portRaw;

      const user =
        this.configService.get<string>('MAIL_USER') ||
        this.configService.get<string>('MAIL_USERNAME');
      const pass =
        this.configService.get<string>('MAIL_PASS') ||
        this.configService.get<string>('MAIL_PASSWORD');

      const encryption =
        this.configService.get<string>('MAIL_ENCRYPTION') ||
        this.configService.get<string>('MAIL_SECURE');

      const secure =
        (typeof encryption === 'string' && encryption.toLowerCase() === 'ssl') ||
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
      const fromAddress =
        this.configService.get<string>('MAIL_FROM_ADDRESS') ||
        this.configService.get<string>('MAIL_FROM');
      const fromName = this.configService.get<string>('MAIL_FROM_NAME');
      const from = fromName && fromAddress ? `${fromName} <${fromAddress}>` : fromAddress;

      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: `【合伙造】您的登录验证码是 ${code}`,
          html,
        });
      } catch (err) {
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
}

