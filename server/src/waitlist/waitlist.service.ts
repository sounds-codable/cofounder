import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);
  private listValidated = false;
  private readonly queueSuccessMessage = '申请成功，已加入排队序列。名额开放后我们会邮件通知你，请留意邮箱。';

  constructor(private configService: ConfigService) {}

  private isDoubleOptinEnabled(): boolean {
    const raw = `${this.configService.get('WAITLIST_DOUBLE_OPTIN_ENABLED') ?? 'true'}`
      .trim()
      .toLowerCase();
    return !['0', 'false', 'off', 'no'].includes(raw);
  }

  private async sendOptinEmail(
    listmonkUrl: string,
    authHeader: string,
    subscriberId: number,
  ): Promise<boolean> {
    const optinRes = await fetch(`${listmonkUrl}/api/subscribers/${subscriberId}/optin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({}),
    });

    if (!optinRes.ok) {
      const optinBody = await optinRes.json().catch(() => ({}));
      this.logger.error(
        `Listmonk optin mail failed: ${optinRes.status} ${JSON.stringify(optinBody)}`,
      );
      return false;
    }

    return true;
  }

  private async findSubscriberIdByEmail(
    listmonkUrl: string,
    authHeader: string,
    email: string,
  ): Promise<number | null> {
    const escapedEmail = email.replace(/'/g, "''");
    const query = encodeURIComponent(`subscribers.email = '${escapedEmail}'`);
    const res = await fetch(
      `${listmonkUrl}/api/subscribers?page=1&per_page=1&query=${query}`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
      },
    );

    if (!res.ok) {
      this.logger.error(`Listmonk subscriber search failed: ${res.status} for ${email}`);
      return null;
    }

    const body = await res.json().catch(() => ({}));
    const id = body?.data?.results?.[0]?.id;
    return Number.isInteger(id) ? id : null;
  }

  private async addSubscriberToList(
    listmonkUrl: string,
    authHeader: string,
    subscriberId: number,
    listId: number,
    subscriptionStatus: 'confirmed' | 'unconfirmed',
  ): Promise<boolean> {
    const res = await fetch(`${listmonkUrl}/api/subscribers/lists`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        ids: [subscriberId],
        action: 'add',
        target_list_ids: [listId],
        status: subscriptionStatus,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      this.logger.error(`Listmonk list membership update failed: ${res.status} ${JSON.stringify(body)}`);
      return false;
    }

    return true;
  }

  async subscribe(email: string): Promise<{ success: boolean; message: string }> {
    const listmonkUrl = (this.configService.get('LISTMONK_URL') || '').replace(/\/+$/, '');
    const listmonkApiUser = this.configService.get('LISTMONK_API_USER') || 'api_user';
    const listmonkApiToken = this.configService.get('LISTMONK_API_TOKEN');
    const listIdRaw = this.configService.get('LISTMONK_LIST_ID') || '1';
    const listId = Number.parseInt(listIdRaw, 10);
    const doubleOptinEnabled = this.isDoubleOptinEnabled();

    if (!listmonkUrl || !listmonkApiToken) {
      this.logger.warn(
        `Listmonk not configured. Would subscribe: ${email}`,
      );
      return { success: true, message: '已记录（Listmonk 未配置，仅日志记录）' };
    }

    if (!Number.isInteger(listId) || listId <= 0) {
      this.logger.error(`Invalid LISTMONK_LIST_ID: ${listIdRaw}`);
      return { success: false, message: '服务配置错误，请联系管理员' };
    }

    try {
      const authHeader = `token ${listmonkApiUser}:${listmonkApiToken}`;

      if (!this.listValidated) {
        const listRes = await fetch(`${listmonkUrl}/api/lists/${listId}`, {
          method: 'GET',
          headers: {
            Authorization: authHeader,
          },
        });

        if (!listRes.ok) {
          this.logger.error(
            `Listmonk list check failed: ${listRes.status} for list ${listId}`,
          );
          return { success: false, message: '邮件列表配置不可用，请稍后重试' };
        }

        this.listValidated = true;
      }

      const res = await fetch(`${listmonkUrl}/api/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          status: 'enabled',
          lists: [listId],
          preconfirm_subscriptions: !doubleOptinEnabled,
        }),
      });

      if (res.ok) {
        if (!doubleOptinEnabled) {
          this.logger.log(`Subscribed: ${email}, confirmation=false, mode=direct`);
          return {
            success: true,
            message: this.queueSuccessMessage,
          };
        }

        const body = await res.json().catch(() => ({}));
        const subscriberId = body?.data?.id;
        const optinSent = Number.isInteger(subscriberId)
          ? await this.sendOptinEmail(listmonkUrl, authHeader, subscriberId)
          : false;

        this.logger.log(`Subscribed: ${email}, confirmation=${optinSent}`);
        return {
          success: true,
          message: optinSent
            ? '请查收确认邮件并点击链接完成订阅'
            : '请稍后查看邮箱（确认邮件可能延迟）',
        };
      }

      const body = await res.json().catch(() => ({}));

      if (res.status === 409 || body?.message?.includes('already exists')) {
        const subscriberId = await this.findSubscriberIdByEmail(listmonkUrl, authHeader, email);
        if (!subscriberId) {
          return { success: false, message: '邮箱已存在，但无法更新列表，请稍后重试' };
        }

        const listUpdated = await this.addSubscriberToList(
          listmonkUrl,
          authHeader,
          subscriberId,
          listId,
          doubleOptinEnabled ? 'unconfirmed' : 'confirmed',
        );

        if (!listUpdated) {
          return { success: false, message: '邮箱已存在，但加入列表失败，请稍后重试' };
        }

        if (!doubleOptinEnabled) {
          return {
            success: true,
            message: this.queueSuccessMessage,
          };
        }

        const optinSent = await this.sendOptinEmail(listmonkUrl, authHeader, subscriberId);
        return {
          success: true,
          message: optinSent
            ? '该邮箱已存在，已重新发送确认邮件，请点击邮箱链接完成订阅'
            : '该邮箱已存在，已加入列表，请稍后查看确认邮件',
        };
      }

      this.logger.error(`Listmonk error: ${res.status} ${JSON.stringify(body)}`);
      return { success: false, message: '订阅失败，请稍后重试' };
    } catch (error) {
      this.logger.error(`Listmonk request failed: ${error}`);
      return { success: false, message: '服务暂时不可用' };
    }
  }
}
