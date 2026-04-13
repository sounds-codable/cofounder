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
    const from = this.getMailFrom();
    const expiresInMinutes = 10;

    await transporter.sendMail({
      from,
      to: email,
      subject: '叩饭(Cofounder) 登录验证码',
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

    const host = this.getMailHost();
    const port = Number(this.getConfigValue(['MAIL_PORT'], '465'));
    const user = this.getMailUser();
    const pass = this.getMailPass();
    const encryption = this.getConfigValue(['MAIL_ENCRYPTION'], '').toLowerCase();
    const secure = this.getConfigValue(['MAIL_SECURE'], encryption === 'ssl' ? 'true' : 'false') === 'true';
    const requireTLS = this.getConfigValue(['MAIL_REQUIRE_TLS'], encryption === 'tls' ? 'true' : 'false') === 'true';

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
    const explicitEnabled = this.getConfigValue(['MAIL_ENABLED'], '').toLowerCase();
    if (explicitEnabled === 'true') {
      return true;
    }
    if (explicitEnabled === 'false') {
      return false;
    }

    const driver = this.getConfigValue(['MAIL_DRIVER'], '').toLowerCase();
    if (driver && driver !== 'smtp') {
      return false;
    }

    return Boolean(this.getMailHost() && this.getMailUser() && this.getMailPass());
  }

  private getMailHost() {
    return this.getConfigValue(['MAIL_HOST'], '');
  }

  private getMailUser() {
    return this.getConfigValue(['MAIL_USER', 'MAIL_USERNAME'], '');
  }

  private getMailPass() {
    return this.getConfigValue(['MAIL_PASS', 'MAIL_PASSWORD'], '');
  }

  private getMailFrom() {
    const from = this.getConfigValue(['MAIL_FROM'], '');
    if (from) {
      return from;
    }

    const fromAddress = this.getConfigValue(['MAIL_FROM_ADDRESS'], '');
    if (!fromAddress) {
      return '叩饭（Cofounder） <hello@example.com>';
    }

    const fromName = this.getConfigValue(['MAIL_FROM_NAME'], '').trim();
    return fromName ? `${fromName} <${fromAddress}>` : fromAddress;
  }

  private getConfigValue(keys: string[], fallback = '') {
    for (const key of keys) {
      const value = this.configService.get<string>(key, '').trim();
      if (value) {
        return value;
      }
    }

    return fallback;
  }
}
