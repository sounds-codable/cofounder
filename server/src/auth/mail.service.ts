import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendLoginCodeEmail(email: string, code: string) {
    if (!this.isMailEnabled()) {
      return {
        delivered: false,
      };
    }

    const transporter = this.getTransporter();
    const from = this.configService.get<string>('MAIL_FROM', '叩饭（Cofounder） <hello@example.com>');
    const expiresInMinutes = 10;

    await transporter.sendMail({
      from,
      to: email,
      subject: '你的叩饭登录验证码',
      text: `你的登录验证码是 ${code}，${expiresInMinutes} 分钟内有效。如果这不是你的操作，请忽略这封邮件。`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.8;color:#111827;">
        <h2 style="margin:0 0 12px;">叩饭 Cofounder 登录验证码</h2>
        <p style="margin:0 0 16px;">你正在登录叩饭 Cofounder。以下验证码 ${expiresInMinutes} 分钟内有效：</p>
        <div style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:6px;">${code}</div>
        <p style="margin:0;">如果这不是你的操作，请忽略这封邮件。</p>
      </div>`,
    });

    return {
      delivered: true,
    };
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('MAIL_HOST', '');
    const port = Number(this.configService.get<string>('MAIL_PORT', '465'));
    const user = this.configService.get<string>('MAIL_USER', '');
    const pass = this.configService.get<string>('MAIL_PASS', '');
    const secure = this.configService.get<string>('MAIL_SECURE', 'true') === 'true';
    const requireTLS = this.configService.get<string>('MAIL_REQUIRE_TLS', 'false') === 'true';

    if (!host || !user || !pass || host === 'smtp.example.com' || pass === 'replace_with_mail_password') {
      throw new ServiceUnavailableException('邮件服务未正确配置，请检查 SMTP 环境变量');
    }

    this.transporter = createTransport({
      host,
      port,
      secure,
      requireTLS,
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  private isMailEnabled() {
    return this.configService.get<string>('MAIL_ENABLED', 'false') === 'true';
  }
}
