import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(private configService: ConfigService) {}

  async subscribe(email: string): Promise<{ success: boolean; message: string }> {
    const listmonkUrl = this.configService.get('LISTMONK_URL');
    const listmonkUser = this.configService.get('LISTMONK_ADMIN_USER');
    const listmonkPass = this.configService.get('LISTMONK_ADMIN_PASS');
    const listId = parseInt(
      this.configService.get('LISTMONK_LIST_ID') || '1',
      10,
    );

    if (!listmonkUrl || !listmonkUser || !listmonkPass) {
      this.logger.warn(
        `Listmonk not configured. Would subscribe: ${email}`,
      );
      return { success: true, message: '已记录（Listmonk 未配置，仅日志记录）' };
    }

    try {
      const auth = Buffer.from(`${listmonkUser}:${listmonkPass}`).toString(
        'base64',
      );

      const res = await fetch(`${listmonkUrl}/api/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          status: 'enabled',
          lists: [listId],
          preconfirm_subscriptions: true,
        }),
      });

      if (res.ok) {
        this.logger.log(`Subscribed: ${email}`);
        return { success: true, message: '订阅成功' };
      }

      const body = await res.json().catch(() => ({}));

      if (res.status === 409 || body?.message?.includes('already exists')) {
        return { success: true, message: '该邮箱已订阅' };
      }

      this.logger.error(`Listmonk error: ${res.status} ${JSON.stringify(body)}`);
      return { success: false, message: '订阅失败，请稍后重试' };
    } catch (error) {
      this.logger.error(`Listmonk request failed: ${error}`);
      return { success: false, message: '服务暂时不可用' };
    }
  }
}
