import { normalizeCardPublicCode } from '@/lib/card-url';
import { fallbackPublicCards, fallbackRequestStates, type PublicCard, type RequestState, type UserRole } from '@/lib/site-data';
import { getStoredAccessToken } from '@/lib/session';

export type ContactMethod = {
  id: string;
  type: string;
  value: string;
  isPrimary: boolean;
};

export type BlogPostListResult = {
  items: Array<{
    id: string;
    pathSegment: string;
    title: string;
    summary: string;
    authorDisplayName: string;
    updatedAt: string;
    createdAt: string;
    likeCount: number;
    commentCount: number;
    likedByMe: boolean;
  }>;
};

export type BlogPostDetail = {
  id: string;
  pathSegment: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  authorDisplayName: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByMe: boolean;
  comments: Array<{
    id: string;
    postId: string;
    parentCommentId: string | null;
    authorUserId: string;
    content: string;
    authorDisplayName: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    pendingVisibleToOwner: boolean;
    canDeleteByMe: boolean;
  }>;
};

export type AdminBlogPosts = {
  items: Array<{
    id: string;
    title: string;
    summary: string;
    contentMarkdown: string;
    authorUserId: string;
    published: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type AdminBlogComments = {
  items: Array<{
    id: string;
    postId: string;
    postTitle: string;
    authorDisplayName: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    riskLevel: 'none' | 'medium' | 'high' | null;
    riskCategories: string[];
    riskMatchedTerms: string[];
    createdAt: string;
    reviewedAt: string | null;
  }>;
};

export type InviteOverview = {
  inviteCode: string | null;
  inviteLink: string | null;
  invitedBy: {
    id: string;
    displayName: string;
  } | null;
  activationGuide: string;
  shareText: string | null;
  invitedUsers: Array<{
    id: string;
    displayName: string;
    registeredAt: string;
  }>;
};

export type PointsOverview = {
  totalPoints: number;
  rules: Array<{
    action: string;
    points: number;
    label: string;
  }>;
  history: Array<{
    id: string;
    action: string;
    points: number;
    description: string;
    relatedUserDisplayName?: string | null;
    createdAt: string;
  }>;
};

export type EngagementState = {
  favorites: Record<string, true>;
  likes: Record<string, true>;
};

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string;
  isAdmin: boolean;
  detailedProfileCompletedAt: string | null;
  lastLoginAt: string | null;
};

export type AdminOverview = {
  summary: {
    totalUsers: number;
    totalCards: number;
    totalProjects: number;
    totalDevelopers: number;
    matchingInProgress: number;
    matchingSuccess: number;
    matchingFailed: number;
    usersWithDetailedProfile: number;
    usersWithContacts: number;
    activeUsersLast7Days: number;
    totalRewardTransactions: number;
  };
  leaders: {
    invitedLeaders: Array<{ userId: string; displayName: string; email: string | null; count: number }>;
    projectLeaders: Array<{ userId: string; displayName: string; email: string | null; count: number }>;
    participationLeaders: Array<{ userId: string; displayName: string; email: string | null; count: number }>;
  };
  riskQueue: Array<{
    id: string;
    userId: string;
    userEmail: string | null;
    cardId: string | null;
    cardPublicCode: string | null;
    operationType: string;
    operationAt: string;
    riskLevel: 'none' | 'medium' | 'high' | null;
    categories: string[];
    matchedTerms: string[];
    confirmedToPublish: boolean;
    contentSnapshot: Record<string, unknown>;
  }>;
  adminNotes: string[];
};

export type RiskReviewPayload = {
  operationType: string;
  riskLevel: 'none' | 'medium' | 'high';
  categories: string[];
  matchedTerms: string[];
  hitFields: string[];
  provider: string;
};

export type AdminUserSearchResult = {
  items: Array<{
    id: string;
    displayName: string;
    email: string | null;
    isAdmin: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    hasDetailedProfile: boolean;
    cardsCount: number;
    invitedUsersCount: number;
    points: number;
    requestParticipationCount: number;
    likesCount: number;
    favoritesCount: number;
  }>;
};

export type AdminUserDetail = {
  user: {
    id: string;
    email: string | null;
    displayName: string;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    inviteCode: string | null;
    invitedByUserId: string | null;
    invitationAcceptedAt: string | null;
    detailedProfileCompletedAt: string | null;
    detailedProfile: Record<string, string> | null;
    contactMethods: ContactMethod[];
  };
  cards: Array<{
    id: string;
    publicCode: string;
    role: UserRole;
    headline: string;
    city: string;
    basicSummary: string;
    strengths: string[];
    updatedAt: string;
    link: string;
  }>;
  invitation: {
    inviter: { id: string; displayName: string; email: string | null } | null;
    invitedUsersCount: number;
    invitedUsers: Array<{
      id: string;
      displayName: string;
      email: string | null;
      createdAt: string;
    }>;
  };
  engagements: {
    likesCount: number;
    favoritesCount: number;
    likes: Array<{
      id: string;
      cardId: string;
      cardPublicCode: string;
      cardHeadline: string;
      link: string;
      firstActivatedAt: string | null;
      updatedAt: string;
    }>;
    favorites: Array<{
      id: string;
      cardId: string;
      cardPublicCode: string;
      cardHeadline: string;
      link: string;
      firstActivatedAt: string | null;
      updatedAt: string;
    }>;
  };
  requests: {
    total: number;
    statusCount: Record<string, number>;
    items: Array<{
      id: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      targetCard: {
        id: string;
        publicCode: string;
        headline: string;
        link: string;
      };
      publisher: {
        id: string;
        displayName: string;
        email: string | null;
      };
      requester: {
        id: string;
        displayName: string;
        email: string | null;
      };
    }>;
  };
  rewards: {
    totalPoints: number;
    transactionCount: number;
    recentTransactions: Array<{
      id: string;
      action: string;
      points: number;
      description: string;
      createdAt: string;
      metadata: Record<string, unknown> | null;
    }>;
  };
  adminHints: {
    updateAdminSql: string;
  };
};

export type AdminDailyFeed = {
  riskQueue: Array<{
    id: string;
    operationType: string;
    operationAt: string;
    riskLevel: 'none' | 'medium' | 'high' | null;
    categories: string[];
    matchedTerms: string[];
    confirmedToPublish: boolean;
    userId: string;
    userEmail: string | null;
    contentSnapshot: Record<string, unknown>;
  }>;
  recentMessages: Array<{
    id: string;
    name: string | null;
    contact: string;
    message: string;
    createdAt: string;
    risk: {
      reviewRequired: boolean;
      riskLevel: 'none' | 'medium' | 'high' | null;
      categories: string[];
      matchedTerms: string[];
      confirmedToPublish: boolean;
    } | null;
  }>;
  recentCards: Array<{
    id: string;
    publicCode: string;
    role: UserRole;
    headline: string;
    city: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  recentUsers: Array<{
    id: string;
    displayName: string;
    email: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    isAdmin: boolean;
  }>;
};

export type AdminPublicWelfareMessages = {
  items: Array<{
    id: string;
    name: string | null;
    contact: string;
    message: string;
    createdAt: string;
    risk: {
      reviewRequired: boolean;
      riskLevel: 'none' | 'medium' | 'high' | null;
      categories: string[];
      matchedTerms: string[];
      confirmedToPublish: boolean;
    } | null;
  }>;
};

export type AdminComplianceLogs = {
  operationLogs: Array<{
    id: string;
    userId: string | null;
    userEmail: string | null;
    operationType: string;
    requestMethod: string;
    requestPath: string;
    statusCode: number | null;
    success: boolean;
    durationMs: number;
    operationAt: string;
    sourceAddress: string | null;
    sourcePort: number | null;
    destinationAddress: string | null;
    destinationPort: number | null;
    clientHardware: string | null;
  }>;
  publishedRecords: Array<{
    id: string;
    userId: string;
    userEmail: string | null;
    cardId: string | null;
    cardPublicCode: string | null;
    operationType: string;
    reviewRequired: boolean;
    riskLevel: 'none' | 'medium' | 'high' | null;
    riskCategories: string[];
    riskMatchedTerms: string[];
    confirmedToPublish: boolean;
    moderationProvider: string | null;
    operationAt: string;
    contentSnapshot: Record<string, unknown>;
  }>;
};

export type MeProfile = {
  user: AuthUser & {
    detailedProfile: {
      intro: string;
      education: string;
      experience: string;
      expertProjectDetail: string;
      developerProjectExperience: string;
      projectDetail: string;
    } | null;
  };
  card: {
    id: string;
    role: UserRole;
    headline: string;
    city: string;
    basicSummary: string;
    optionalDirection: string | null;
    strengths: string[];
  } | null;
  contactMethods: ContactMethod[];
  completion: {
    hasBasicProfile: boolean;
    hasDetailProfile: boolean;
    hasPublicCard: boolean;
  };
};

export type PublicWelfareMessageResult = {
  id: string;
  createdAt: string;
};

export type LogoVariant = 'overlap' | 'spark' | 'bridge' | 'orbit';

export type ViewerState = {
  requestId: string;
  status: string;
  detailVisible: boolean;
  contactVisible: boolean;
  revealedDetail: PublicCard['detailPreview'] | null;
  contactMethods: ContactMethod[];
};

export type PlatformCardDetail = PublicCard & {
  viewerState: ViewerState | null;
};

export type RequestTargetCard = {
  id: string;
  headline: string;
  city: string;
  role: UserRole;
  ownerName: string;
};

export type OutgoingRequest = {
  id: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  publisherViewedRequesterDetailAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  contactExchangedAt?: string | null;
  exchangeReviewingAt?: string | null;
  requesterDeclinedContactAt?: string | null;
  targetCard: RequestTargetCard;
  publisher: {
    id: string;
    displayName: string;
    detailedProfile: PublicCard['detailPreview'] | null;
    contactMethods: ContactMethod[];
  };
  actions: {
    canExchangeContact: boolean;
  };
};

export type IncomingRequest = {
  id: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  publisherViewedRequesterDetailAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  contactExchangedAt?: string | null;
  exchangeReviewingAt?: string | null;
  requesterDeclinedContactAt?: string | null;
  targetCard: RequestTargetCard;
  requester: {
    id: string;
    displayName: string;
    detailedProfile: PublicCard['detailPreview'] | null;
    contactMethods: ContactMethod[];
  };
  actions: {
    canViewRequesterDetail: boolean;
    canApprove: boolean;
    canReject: boolean;
    canExchangeContact: boolean;
  };
};

export type RequestCenterResponse = {
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
};

export type PlatformOverview = {
  roles: Array<{
    key: UserRole;
    label: string;
  }>;
  stats: {
    totalCards: number;
    expertCards: number;
    developerCards: number;
  };
  requestStates: RequestState[];
  logoVariant: LogoVariant;
};

export type TagSuggestion = {
  name: string;
  usageCount: number;
};

function getDefaultApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return '/api';
  }

  return 'http://localhost:3010/api';
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || getDefaultApiBaseUrl();
}

type RequestOptions = {
  body?: unknown;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string | null;
};

function translateHttpStatusMessage(status: number) {
  switch (status) {
    case 400:
      return '请求参数有误，请检查后重试。';
    case 401:
      return '登录状态已失效，请重新登录后重试。';
    case 403:
      return '你暂无权限执行此操作。';
    case 404:
      return '请求的内容不存在或已失效。';
    case 409:
      return '当前操作与现有数据冲突，请刷新后重试。';
    case 422:
      return '提交内容不符合要求，请检查后重试。';
    case 500:
      return '服务器开小差了，请稍后再试。';
    default:
      return `请求失败（状态码 ${status}），请稍后重试。`;
  }
}

function translateEnglishErrorMessage(message: string) {
  const normalized = message.trim();

  if (!normalized) {
    return '请求失败';
  }

  if (/[\u4e00-\u9fff]/.test(normalized)) {
    return normalized;
  }

  let match = normalized.match(/^Request failed:\s*(\d{3})$/i);
  if (match) {
    return translateHttpStatusMessage(Number(match[1]));
  }

  if (/^Bad Request$/i.test(normalized)) {
    return '请求参数有误，请检查后重试。';
  }

  if (/^Unauthorized$/i.test(normalized)) {
    return '登录状态已失效，请重新登录后重试。';
  }

  if (/^Forbidden$/i.test(normalized)) {
    return '你暂无权限执行此操作。';
  }

  if (/^Not Found$/i.test(normalized)) {
    return '请求的内容不存在或已失效。';
  }

  if (/^Internal Server Error$/i.test(normalized)) {
    return '服务器开小差了，请稍后再试。';
  }

  match = normalized.match(/^(.+?) must be longer than or equal to (\d+) characters$/i);
  if (match) {
    return `${match[1]}不能少于 ${match[2]} 个字符`;
  }

  match = normalized.match(/^(.+?) must be shorter than or equal to (\d+) characters$/i);
  if (match) {
    return `${match[1]}不能超过 ${match[2]} 个字符`;
  }

  match = normalized.match(/^(.+?) must be equal to (\d+) characters$/i);
  if (match) {
    return `${match[1]}长度必须为 ${match[2]} 个字符`;
  }

  if (/must be an email$/i.test(normalized)) {
    return '邮箱格式不正确';
  }

  if (/must be a string$/i.test(normalized)) {
    return '提交内容格式不正确';
  }

  if (/must be a boolean value$/i.test(normalized)) {
    return '提交内容格式不正确';
  }

  if (/must match/i.test(normalized)) {
    return '提交内容格式不正确';
  }

  if (/should not be empty$/i.test(normalized)) {
    return '请先完善必填内容';
  }

  if (/failed to fetch/i.test(normalized) || /^Network Error$/i.test(normalized)) {
    return '网络请求失败，请检查网络或稍后重试。';
  }

  return '操作失败，请检查输入后重试。';
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = Object.prototype.hasOwnProperty.call(options, 'token') ? options.token : getStoredAccessToken();
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (error) {
    if (error instanceof Error && /failed to fetch/i.test(error.message)) {
      throw new Error('网络请求失败：请确认后端服务已启动（默认端口 3010），然后刷新页面重试。');
    }

    throw error;
  }

  if (!response.ok) {
    const text = await response.text();

    try {
      const parsed = JSON.parse(text) as {
        code?: string;
        riskReview?: RiskReviewPayload;
      };

      if (
        parsed.code === 'RISK_REVIEW_REQUIRED' &&
        parsed.riskReview &&
        options.method &&
        options.method !== 'GET' &&
        options.body &&
        typeof options.body === 'object' &&
        !Array.isArray(options.body) &&
        !(options.body as { riskConfirmed?: boolean }).riskConfirmed &&
        typeof window !== 'undefined'
      ) {
        const confirmed = window.confirm(
          `系统检测到潜在风险内容。\n风险等级：${parsed.riskReview.riskLevel}\n命中类别：${parsed.riskReview.categories.join('、') || '未知'}\n命中词：${parsed.riskReview.matchedTerms.join('、') || '未知'}\n\n是否仍继续发布？`,
        );

        if (confirmed) {
          return requestJson<T>(path, {
            ...options,
            body: {
              ...(options.body as Record<string, unknown>),
              riskConfirmed: true,
            },
          });
        }

        throw new Error('你已取消本次发布。');
      }
    } catch {
      // noop
    }

    throw new Error(text || translateHttpStatusMessage(response.status));
  }

  return (await response.json()) as T;
}

export async function fetchOverview() {
  try {
    return await requestJson<PlatformOverview>('/platform/overview');
  } catch {
    return null;
  }
}

export async function fetchCards(role?: UserRole) {
  try {
    const search = role ? `?role=${role}` : '';
    return await requestJson<PublicCard[]>(`/platform/cards${search}`);
  } catch {
    if (role) {
      return fallbackPublicCards.filter((card) => card.role === role);
    }

    return fallbackPublicCards;
  }
}

export async function fetchTagSuggestions(query: string, limit = 8) {
  const searchParams = new URLSearchParams();

  if (query.trim()) {
    searchParams.set('query', query.trim());
  }

  searchParams.set('limit', String(limit));

  try {
    const suffix = searchParams.toString();
    return await requestJson<TagSuggestion[]>(`/platform/tags${suffix ? `?${suffix}` : ''}`);
  } catch {
    return [];
  }
}

export async function fetchCardById(id: string) {
  const normalizedId = normalizeCardPublicCode(id) || id;

  try {
    return await requestJson<PlatformCardDetail>(`/platform/cards/${normalizedId}`);
  } catch {
    const fallbackCard = fallbackPublicCards.find((card) => card.id === normalizedId) ?? null;

    if (!fallbackCard) {
      return null;
    }

    return {
      ...fallbackCard,
      viewerState: null,
    };
  }
}

export async function fetchRequestStates() {
  try {
    return await requestJson<RequestState[]>('/platform/request-states');
  } catch {
    return fallbackRequestStates;
  }
}

export function extractErrorMessage(error: unknown) {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { message?: string | string[] };

      if (Array.isArray(parsed.message)) {
        return parsed.message.map((item) => translateEnglishErrorMessage(item)).join('，');
      }

      return parsed.message ? translateEnglishErrorMessage(parsed.message) : translateEnglishErrorMessage(error.message);
    } catch {
      return translateEnglishErrorMessage(error.message);
    }
  }

  return '请求失败';
}

export function isUnauthorizedError(error: unknown) {
  return extractErrorMessage(error).includes('请先登录') || extractErrorMessage(error).includes('登录态');
}

export function extractRiskReview(error: unknown): RiskReviewPayload | null {
  if (!(error instanceof Error)) {
    return null;
  }

  try {
    const parsed = JSON.parse(error.message) as {
      code?: string;
      riskReview?: RiskReviewPayload;
    };

    if (parsed.code === 'RISK_REVIEW_REQUIRED' && parsed.riskReview) {
      return parsed.riskReview;
    }
  } catch {
    return null;
  }

  return null;
}

export async function sendLoginCode(email: string, inviteCode?: string) {
  return requestJson<{ ok: boolean; expiresInSeconds: number; delivery: 'smtp' | 'dev'; message: string; devCode?: string }>('/auth/send-code', {
    method: 'POST',
    body: {
      email,
      ...(inviteCode?.trim() ? { inviteCode: inviteCode.trim() } : {}),
    },
    token: null,
  });
}

export async function verifyLoginCode(email: string, code: string) {
  return requestJson<{ accessToken: string; user: AuthUser }>('/auth/verify-code', {
    method: 'POST',
    body: { email, code },
    token: null,
  });
}

export async function fetchMe() {
  return requestJson<MeProfile>('/me');
}

export async function saveBasicProfile(body: {
  role: UserRole;
  headline: string;
  basicSummary: string;
  city: string;
  desiredDirection?: string;
  strengths: string[];
  riskConfirmed?: boolean;
 }) {
  return requestJson<MeProfile>('/me/basic', {
    method: 'PUT',
    body,
  });
}

export async function updateMyCardBasic(
  cardId: string,
  body: {
    headline: string;
    basicSummary: string;
    city: string;
    strengths: string[];
    riskConfirmed?: boolean;
  },
) {
  return requestJson<{
    id: string;
    role: UserRole;
    headline: string;
    city: string;
    basicSummary: string;
    strengths: string[];
    updatedAt: string;
  }>(`/me/card/${encodeURIComponent(cardId)}`, {
    method: 'PUT',
    body,
  });
}

export async function deleteMyCard(cardId: string) {
  return requestJson<{ ok: boolean }>(`/me/card/${encodeURIComponent(cardId)}`, {
    method: 'DELETE',
  });
}

export async function saveDetailProfile(body: {
  intro: string;
  education: string;
  experience: string;
  expertProjectDetail?: string;
  developerProjectExperience?: string;
  projectDetail?: string;
  riskConfirmed?: boolean;
}) {
  return requestJson<MeProfile>('/me/detail', {
    method: 'PUT',
    body,
  });
}

export async function saveContactMethods(body: {
  phone?: string;
  wechat?: string;
  qq?: string;
  email?: string;
  other?: string;
  riskConfirmed?: boolean;
}) {
  return requestJson<MeProfile>('/me/contacts', {
    method: 'PUT',
    body,
  });
}

export async function fetchDisplayNameAvailability(displayName: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('displayName', displayName);

  return requestJson<{
    available: boolean;
    normalizedDisplayName: string;
    message: string | null;
  }>(`/me/display-name-availability?${searchParams.toString()}`);
}

export async function saveDisplayName(displayName: string, riskConfirmed?: boolean) {
  return requestJson<MeProfile>('/me/display-name', {
    method: 'PUT',
    body: { displayName, riskConfirmed },
  });
}

export async function fetchMyRequests() {
  return requestJson<RequestCenterResponse>('/requests');
}

export async function createDetailRequest(cardId: string) {
  return requestJson<OutgoingRequest>('/requests', {
    method: 'POST',
    body: { cardId },
  });
}

export async function viewRequesterDetail(requestId: string) {
  return requestJson<IncomingRequest>(`/requests/${requestId}/view-requester-detail`, {
    method: 'POST',
  });
}

export async function approveDetailRequest(requestId: string) {
  return requestJson<IncomingRequest>(`/requests/${requestId}/approve`, {
    method: 'POST',
  });
}

export async function rejectDetailRequest(requestId: string, reason: string, riskConfirmed?: boolean) {
  return requestJson<IncomingRequest>(`/requests/${requestId}/reject`, {
    method: 'POST',
    body: { reason, riskConfirmed },
  });
}

export async function exchangeContact(requestId: string) {
  return requestJson<IncomingRequest | OutgoingRequest>(`/requests/${requestId}/exchange-contact`, {
    method: 'POST',
  });
}

export async function markExchangeReviewing(requestId: string) {
  return requestJson<OutgoingRequest>(`/requests/${requestId}/mark-exchange-reviewing`, {
    method: 'POST',
  });
}

export async function declineContact(requestId: string, reason: string, riskConfirmed?: boolean) {
  return requestJson<OutgoingRequest>(`/requests/${requestId}/decline-contact`, {
    method: 'POST',
    body: { reason, riskConfirmed },
  });
}

export async function submitPublicWelfareMessage(body: {
  name?: string;
  contact: string;
  message: string;
  riskConfirmed?: boolean;
}) {
  return requestJson<PublicWelfareMessageResult>('/public-welfare/messages', {
    method: 'POST',
    body,
    token: null,
  });
}

export async function fetchInviteOverview() {
  return requestJson<InviteOverview>('/me/invites');
}

export async function fetchPointsOverview() {
  return requestJson<PointsOverview>('/me/points');
}

export async function fetchMyEngagements() {
  return requestJson<EngagementState>('/me/engagements');
}

export async function toggleCardEngagement(body: {
  cardId: string;
  type: 'like' | 'favorite';
  active: boolean;
}) {
  return requestJson<{ cardId: string; type: 'like' | 'favorite'; active: boolean }>('/me/engagements', {
    method: 'POST',
    body,
  });
}

export async function fetchAdminOverview() {
  return requestJson<AdminOverview>('/admin/overview');
}

export async function fetchAdminUsers(query?: string, limit = 20) {
  const searchParams = new URLSearchParams();

  if (query?.trim()) {
    searchParams.set('query', query.trim());
  }

  searchParams.set('limit', String(limit));

  return requestJson<AdminUserSearchResult>(`/admin/users?${searchParams.toString()}`);
}

export async function fetchAdminUserDetail(userId: string) {
  return requestJson<AdminUserDetail>(`/admin/users/${encodeURIComponent(userId)}`);
}

export async function fetchAdminComplianceLogs(limit = 50) {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(limit));
  return requestJson<AdminComplianceLogs>(`/admin/compliance-logs?${searchParams.toString()}`);
}

export async function fetchAdminDailyFeed(limit = 20) {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(limit));
  return requestJson<AdminDailyFeed>(`/admin/daily-feed?${searchParams.toString()}`);
}

export async function fetchAdminPublicWelfareMessages(options?: { query?: string; limit?: number; riskOnly?: boolean }) {
  const searchParams = new URLSearchParams();

  if (options?.query?.trim()) {
    searchParams.set('query', options.query.trim());
  }

  searchParams.set('limit', String(options?.limit ?? 50));

  if (options?.riskOnly) {
    searchParams.set('riskOnly', 'true');
  }

  return requestJson<AdminPublicWelfareMessages>(`/admin/public-welfare/messages?${searchParams.toString()}`);
}

export async function fetchAdminPublicWelfareMessageById(messageId: string) {
  return requestJson<{
    id: string;
    name: string | null;
    contact: string;
    message: string;
    createdAt: string;
    risk: {
      reviewRequired: boolean;
      riskLevel: 'none' | 'medium' | 'high' | null;
      categories: string[];
      matchedTerms: string[];
      confirmedToPublish: boolean;
    } | null;
  }>(`/admin/public-welfare/messages/${encodeURIComponent(messageId)}`);
}

export async function updateAdminPublicWelfareMessage(
  messageId: string,
  body: {
    name?: string;
    contact: string;
    message: string;
    riskConfirmed?: boolean;
  },
) {
  return requestJson<{ id: string; name: string | null; contact: string; message: string; createdAt: string }>(
    `/admin/public-welfare/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PUT',
      body,
    },
  );
}

export async function deleteBlogComment(postId: string, commentId: string) {
  return requestJson<{ ok: boolean }>(`/blog/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
}

export async function deleteAdminPublicWelfareMessage(messageId: string) {
  return requestJson<{ ok: boolean }>(`/admin/public-welfare/messages/${encodeURIComponent(messageId)}`, {
    method: 'DELETE',
  });
}

export async function fetchBlogPosts() {
  return requestJson<BlogPostListResult>('/blog/posts');
}

export async function fetchBlogPostById(postId: string) {
  return requestJson<BlogPostDetail>(`/blog/posts/${encodeURIComponent(postId)}`);
}

export async function toggleBlogLike(postId: string) {
  return requestJson<{ liked: boolean }>(`/blog/posts/${encodeURIComponent(postId)}/likes/toggle`, {
    method: 'POST',
  });
}

export async function createBlogComment(postId: string, body: { content: string; parentCommentId?: string; riskConfirmed?: boolean }) {
  return requestJson<{ id: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string }>(
    `/blog/posts/${encodeURIComponent(postId)}/comments`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function fetchAdminBlogPosts() {
  return requestJson<AdminBlogPosts>('/blog/admin/posts');
}

export async function createAdminBlogPost(body: {
  title: string;
  summary: string;
  contentMarkdown: string;
  published?: boolean;
  riskConfirmed?: boolean;
}) {
  return requestJson<{ id: string }>('/blog/admin/posts', {
    method: 'POST',
    body,
  });
}

export async function updateAdminBlogPost(
  postId: string,
  body: {
    title?: string;
    summary?: string;
    contentMarkdown?: string;
    published?: boolean;
    riskConfirmed?: boolean;
  },
) {
  return requestJson<{ id: string }>(`/blog/admin/posts/${encodeURIComponent(postId)}`, {
    method: 'PUT',
    body,
  });
}

export async function deleteAdminBlogPost(postId: string) {
  return requestJson<{ ok: boolean }>(`/blog/admin/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminBlogComments(status?: 'pending' | 'approved' | 'rejected') {
  const query = status ? `?status=${status}` : '';
  return requestJson<AdminBlogComments>(`/blog/admin/comments${query}`);
}

export async function reviewAdminBlogComment(commentId: string, body: { status: 'approved' | 'rejected'; reason?: string }) {
  return requestJson<{ id: string; status: 'approved' | 'rejected'; reviewedAt: string }>(
    `/blog/admin/comments/${encodeURIComponent(commentId)}/review`,
    {
      method: 'POST',
      body,
    },
  );
}
