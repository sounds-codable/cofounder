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
var WaitlistService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitlistService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let WaitlistService = WaitlistService_1 = class WaitlistService {
    configService;
    logger = new common_1.Logger(WaitlistService_1.name);
    listValidated = false;
    queueSuccessMessage = '申请成功，已加入排队序列。名额开放后我们会邮件通知你，请留意邮箱。';
    constructor(configService) {
        this.configService = configService;
    }
    isDoubleOptinEnabled() {
        const raw = `${this.configService.get('WAITLIST_DOUBLE_OPTIN_ENABLED') ?? 'true'}`
            .trim()
            .toLowerCase();
        return !['0', 'false', 'off', 'no'].includes(raw);
    }
    async sendOptinEmail(listmonkUrl, authHeader, subscriberId) {
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
            this.logger.error(`Listmonk optin mail failed: ${optinRes.status} ${JSON.stringify(optinBody)}`);
            return false;
        }
        return true;
    }
    async findSubscriberIdByEmail(listmonkUrl, authHeader, email) {
        const escapedEmail = email.replace(/'/g, "''");
        const query = encodeURIComponent(`subscribers.email = '${escapedEmail}'`);
        const res = await fetch(`${listmonkUrl}/api/subscribers?page=1&per_page=1&query=${query}`, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
            },
        });
        if (!res.ok) {
            this.logger.error(`Listmonk subscriber search failed: ${res.status} for ${email}`);
            return null;
        }
        const body = await res.json().catch(() => ({}));
        const id = body?.data?.results?.[0]?.id;
        return Number.isInteger(id) ? id : null;
    }
    async addSubscriberToList(listmonkUrl, authHeader, subscriberId, listId, subscriptionStatus) {
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
    async subscribe(email) {
        const listmonkUrl = (this.configService.get('LISTMONK_URL') || '').replace(/\/+$/, '');
        const listmonkApiUser = this.configService.get('LISTMONK_API_USER') || 'api_user';
        const listmonkApiToken = this.configService.get('LISTMONK_API_TOKEN');
        const listIdRaw = this.configService.get('LISTMONK_LIST_ID') || '1';
        const listId = Number.parseInt(listIdRaw, 10);
        const doubleOptinEnabled = this.isDoubleOptinEnabled();
        if (!listmonkUrl || !listmonkApiToken) {
            this.logger.warn(`Listmonk not configured. Would subscribe: ${email}`);
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
                    this.logger.error(`Listmonk list check failed: ${listRes.status} for list ${listId}`);
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
                const listUpdated = await this.addSubscriberToList(listmonkUrl, authHeader, subscriberId, listId, doubleOptinEnabled ? 'unconfirmed' : 'confirmed');
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
        }
        catch (error) {
            this.logger.error(`Listmonk request failed: ${error}`);
            return { success: false, message: '服务暂时不可用' };
        }
    }
};
exports.WaitlistService = WaitlistService;
exports.WaitlistService = WaitlistService = WaitlistService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WaitlistService);
//# sourceMappingURL=waitlist.service.js.map