'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CardPublishForm } from '@/components/card-publish-form';
import { CardEngagementActions } from '@/components/card-engagement-actions';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { buildCardPathFromCard, buildCardSharePathFromCard } from '@/lib/card-url';
import { formatBeijingDateTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import {
  approveDetailRequest,
  createDetailRequest,
  deleteMyCard,
  declineContact,
  exchangeContact,
  extractErrorMessage,
  extractRiskReview,
  fetchCardById,
  fetchMyRequests,
  markExchangeReviewing,
  rejectDetailRequest,
  saveContactMethods,
  saveDetailProfile,
  type ContactMethod,
  type IncomingRequest,
  type OutgoingRequest,
  type PlatformCardDetail,
  viewRequesterDetail,
} from '@/lib/platform-api';
import { fallbackPublicCards, roleLabels, type UserRole } from '@/lib/site-data';
import { useAuthState } from '@/lib/use-auth';

type CardDetailClientProps = {
  id: string;
};

type DetailField = 'intro' | 'education' | 'experience' | 'projectDetail';
type DetailProfileLike = Partial<{
  intro: string;
  education: string;
  experience: string;
  projectDetail: string;
  expertProjectDetail: string;
  developerProjectExperience: string;
}>;

type ContactDisplayItem = {
  id: string;
  label: string;
  value: string;
};

const detailFieldMeta: Record<DetailField, { label: string; minLength: number }> = {
  intro: { label: '个人简介', minLength: 6 },
  education: { label: '教育背景', minLength: 4 },
  experience: { label: '工作背景', minLength: 6 },
  projectDetail: { label: '项目补充信息', minLength: 6 },
};

function getProjectFieldLabel(role?: UserRole | null) {
  return role === 'developer' ? '做过的项目/产品' : '项目详情';
}

function buildRequestDetailSnapshotPayload(values: { intro: string; education: string; experience: string; projectDetail: string }) {
  return {
    intro: values.intro.trim(),
    education: values.education.trim(),
    experience: values.experience.trim(),
    projectDetail: values.projectDetail.trim(),
  };
}

function getProjectFieldPlaceholder(role?: UserRole | null) {
  return role === 'developer' ? '请概要介绍你做过的具体项目、产品或代表作品。' : '您想合作的项目的情况，描述越详细，越能吸引此程序员的合作意向。';
}

function getRoleSpecificProjectDetail(detailProfile: DetailProfileLike | null | undefined, role?: UserRole | null) {
  if (!detailProfile) {
    return '';
  }

  if (role === 'developer') {
    return detailProfile.developerProjectExperience || detailProfile.projectDetail || '';
  }

  return detailProfile.expertProjectDetail || detailProfile.projectDetail || '';
}

function buildDetailRows(detailProfile: DetailProfileLike | null | undefined, role: UserRole, fallbackText: string): ReadonlyArray<readonly [string, string]> {
  return [
    ['个人简介', detailProfile?.intro || fallbackText],
    ['教育背景', detailProfile?.education || fallbackText],
    ['工作背景', detailProfile?.experience || fallbackText],
    [getProjectFieldLabel(role), getRoleSpecificProjectDetail(detailProfile, role) || fallbackText],
  ];
}

function buildDetailProfilePayload(role: UserRole, values: { intro: string; education: string; experience: string; projectDetail: string }) {
  if (role === 'developer') {
    return {
      intro: values.intro,
      education: values.education,
      experience: values.experience,
      developerProjectExperience: values.projectDetail,
    };
  }

  return {
    intro: values.intro,
    education: values.education,
    experience: values.experience,
    expertProjectDetail: values.projectDetail,
  };
}

const viewerStatusLabels: Record<string, string> = {
  approved_detail_visible: '已收到联系申请 - 待处理',
  contact_exchanged: '匹配成功！',
  pending_request: '已申请更多信息',
  publisher_viewed_detail: '已申请更多信息',
  requester_declined_contact: '不想联系',
  rejected: '已拒绝',
};

const defaultRejectReason = '感谢你认真介绍自己，也花时间提交了详细信息。我们这边评估后，感觉你目前的经历和这个项目阶段匹配度还不够高，所以这次先不继续推进。后续如果有更合适的合作机会，我会第一时间联系你。';

function formatDateTime(value?: string | null) {
  return `${formatBeijingDateTime(value, '时间未知')}`;
}

function formatPublishedAt(updatedAt?: string, ownerName?: string) {
  return `${formatBeijingDateTime(updatedAt, '时间未知')} by ${ownerName?.trim() || '未知发布者'}`;
}

function getDetailFieldError(field: DetailField, value: string, projectFieldLabel = detailFieldMeta.projectDetail.label) {
  const trimmed = value.trim();
  const { minLength } = detailFieldMeta[field];
  const label = field === 'projectDetail' ? projectFieldLabel : detailFieldMeta[field].label;

  if (!trimmed) {
    return `请填写${label}`;
  }

  if (trimmed.length < minLength) {
    return `${label}至少需要 ${minLength} 个字符`;
  }

  return '';
}

function validateDetailFields(values: Record<DetailField, string>, projectFieldLabel = detailFieldMeta.projectDetail.label) {
  return (Object.keys(values) as DetailField[]).reduce<Partial<Record<DetailField, string>>>((acc, field) => {
    const nextError = getDetailFieldError(field, values[field], projectFieldLabel);

    if (nextError) {
      acc[field] = nextError;
    }

    return acc;
  }, {});
}

function parseDetailFieldErrorsFromMessage(message: string, projectFieldLabel = detailFieldMeta.projectDetail.label) {
  const text = message.toLowerCase();
  const nextErrors: Partial<Record<DetailField, string>> = {};

  const matchers: Array<[DetailField, RegExp[]]> = [
    ['intro', [/intro/, /个人简介/]],
    ['education', [/education/, /教育背景/]],
    ['experience', [/experience/, /工作背景/]],
    ['projectDetail', [/projectdetail/, /project detail/, /expertprojectdetail/, /developerprojectexperience/, /项目详情/, /项目介绍/, /做过的项目/, /项目\/产品/]],
  ];

  matchers.forEach(([field, patterns]) => {
    if (patterns.some((pattern) => pattern.test(text))) {
      const label = field === 'projectDetail' ? projectFieldLabel : detailFieldMeta[field].label;
      nextErrors[field] = label + `至少需要 ${detailFieldMeta[field].minLength} 个字符`;
    }
  });

  return nextErrors;
}

function getContactValueByType(contactMethods: ContactMethod[] | undefined, type: string) {
  if (!contactMethods || contactMethods.length === 0) {
    return '';
  }

  const normalized = type.toLowerCase();
  return contactMethods.find((item) => item.type.toLowerCase() === normalized)?.value || '';
}

function splitOtherContactValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { displayName: '', other: '' };
  }

  const withName = trimmed.match(/^称呼\s*[：:]\s*([^;；\n]+)(?:[;；\n](.*))?$/);

  if (!withName) {
    return { displayName: '', other: trimmed };
  }

  return {
    displayName: (withName[1] || '').trim(),
    other: (withName[2] || '').trim(),
  };
}

function composeOtherContactValue(displayName: string, other: string) {
  const normalizedName = displayName.trim();
  const normalizedOther = other.trim();

  if (normalizedName && normalizedOther) {
    return `称呼：${normalizedName}；${normalizedOther}`;
  }

  if (normalizedName) {
    return `称呼：${normalizedName}`;
  }

  return normalizedOther;
}

const contactTypeLabels: Record<string, string> = {
  phone: '手机号',
  wechat: '微信',
  email: '邮箱',
  qq: 'QQ',
  other: '其他联系方式',
};

function formatContactType(type: string) {
  return contactTypeLabels[type.toLowerCase()] || type;
}

function normalizeContactDisplayItems(contactMethods: ContactMethod[] | undefined, keyPrefix: string): ContactDisplayItem[] {
  if (!contactMethods || contactMethods.length === 0) {
    return [];
  }

  const displayNameItems: ContactDisplayItem[] = [];
  const otherItems: ContactDisplayItem[] = [];

  contactMethods.forEach((contact) => {
    if (contact.type.toLowerCase() !== 'other') {
      otherItems.push({
        id: `${keyPrefix}-${contact.id}`,
        label: formatContactType(contact.type),
        value: contact.value,
      });
      return;
    }

    const parsed = splitOtherContactValue(contact.value);

    if (parsed.displayName) {
      displayNameItems.push({
        id: `${keyPrefix}-${contact.id}-displayName`,
        label: '称呼',
        value: parsed.displayName,
      });
    }

    if (parsed.other) {
      otherItems.push({
        id: `${keyPrefix}-${contact.id}-other`,
        label: '其他联系方式',
        value: parsed.other,
      });
    }

    if (!parsed.displayName && !parsed.other) {
      otherItems.push({
        id: `${keyPrefix}-${contact.id}-fallback`,
        label: '其他联系方式',
        value: contact.value,
      });
    }
  });

  return [...displayNameItems, ...otherItems];
}

function maskContactValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '******';
  }

  const visibleMaskLength = Math.max(6, Math.min(12, trimmed.length));
  return '•'.repeat(visibleMaskLength);
}

function getViewerStatusBadgeClass(status?: string | null) {
  if (!status) {
    return 'border-border/80 bg-background/88 text-foreground';
  }

  if (status === 'approved_detail_visible') {
    return 'border-sky-300/80 bg-sky-50/90 text-sky-800';
  }

  if (status === 'pending_request' || status === 'publisher_viewed_detail') {
    return 'border-amber-300/80 bg-amber-50/90 text-amber-800';
  }

  if (status === 'contact_exchanged') {
    return 'border-cyan-300/80 bg-cyan-50/90 text-cyan-800';
  }

  if (status === 'requester_declined_contact') {
    return 'border-rose-300/80 bg-rose-50/90 text-rose-800';
  }

  if (status === 'rejected') {
    return 'border-rose-300/80 bg-rose-50/90 text-rose-800';
  }

  if (status === 'received_request') {
    return 'border-sky-300/80 bg-sky-50/90 text-sky-800';
  }

  return 'border-border/80 bg-background/88 text-foreground';
}

function getIncomingRequestStatusLabel(status: string) {
  if (status === 'requester_declined_contact') {
    return '当前状态：对方不想联系';
  }

  if (status === 'rejected') {
    return '当前状态：已不感兴趣';
  }

  if (status === 'contact_exchanged') {
    return '当前状态：匹配成功！';
  }

  if (status === 'approved_detail_visible') {
    return '当前状态：已申请聊聊';
  }

  return '当前状态：已收到联系申请 - 待处理';
}

function getIncomingRequestStatusBadgeClass(status: string) {
  if (status === 'rejected') {
    return 'border-rose-300/80 bg-rose-50/90 text-rose-800';
  }

  if (status === 'requester_declined_contact') {
    return 'border-amber-300/80 bg-amber-50/90 text-amber-800';
  }

  if (status === 'contact_exchanged') {
    return 'border-cyan-300/80 bg-cyan-50/90 text-cyan-800';
  }

  if (status === 'approved_detail_visible') {
    return 'border-emerald-300/80 bg-emerald-50/90 text-emerald-800';
  }

  return 'border-amber-300/80 bg-amber-50/90 text-amber-800';
}

export function CardDetailClient({ id }: CardDetailClientProps) {
  const router = useRouter();
  const { authenticated, profile, refresh } = useAuthState();
  const fallbackCard = useMemo(() => fallbackPublicCards.find((item) => item.id === id) ?? null, [id]);
  const [card, setCard] = useState<PlatformCardDetail | null>(
    fallbackCard
      ? {
          ...fallbackCard,
          viewerState: null,
        }
      : null,
  );
  const [loading, setLoading] = useState(!fallbackCard);
  const [, setMessage] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [editingDetailInRequestModal, setEditingDetailInRequestModal] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);
  const [intro, setIntro] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [projectDetail, setProjectDetail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<DetailField, string>>>({});
  const [requestMeta, setRequestMeta] = useState<OutgoingRequest | null>(null);
  const [incomingRequestsForCard, setIncomingRequestsForCard] = useState<IncomingRequest[]>([]);
  const [activeIncomingRequest, setActiveIncomingRequest] = useState<IncomingRequest | null>(null);
  const [requesterDetailModalOpen, setRequesterDetailModalOpen] = useState(false);
  const [approveRequestModalOpen, setApproveRequestModalOpen] = useState(false);
  const [editingDetailInApproveModal, setEditingDetailInApproveModal] = useState(false);
  const [rejectRequestModalOpen, setRejectRequestModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(defaultRejectReason);
  const [incomingModalMessage, setIncomingModalMessage] = useState<string | null>(null);
  const [pendingIncomingActionRequestId, setPendingIncomingActionRequestId] = useState<string | null>(null);
  const [exchangeContactModalOpen, setExchangeContactModalOpen] = useState(false);
  const [exchangeModalMessage, setExchangeModalMessage] = useState<string | null>(null);
  const [savingExchangeContact, setSavingExchangeContact] = useState(false);
  const [exchangeRejectReason, setExchangeRejectReason] = useState(
    '感谢你提供这么完整的信息，也谢谢你的耐心。我们评估后觉得当前合作时机还不够合适，这次先不联系了。后续如果出现更匹配的方向，期待再沟通。',
  );
  const [contactDisplayName, setContactDisplayName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWechat, setContactWechat] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactQq, setContactQq] = useState('');
  const [contactOther, setContactOther] = useState('');
  const [contactValidationMessage, setContactValidationMessage] = useState<string | null>(null);
  const [exchangeJustCompleted, setExchangeJustCompleted] = useState(false);
  const [justExchangedPublisherContacts, setJustExchangedPublisherContacts] = useState<ContactMethod[]>([]);
  const [riskNoticeModalOpen, setRiskNoticeModalOpen] = useState(false);
  const [mvpGuideModalOpen, setMvpGuideModalOpen] = useState(false);
  const [contactDisclosureModalOpen, setContactDisclosureModalOpen] = useState(false);
  const [pendingContactRevealKey, setPendingContactRevealKey] = useState<string | null>(null);
  const [revealedContactValuesByKey, setRevealedContactValuesByKey] = useState<Record<string, boolean>>({});
  const [processedActionAtByRequestId, setProcessedActionAtByRequestId] = useState<Record<string, string>>({});
  const [expandedCommunicationInfoById, setExpandedCommunicationInfoById] = useState<Record<string, boolean>>({});
  const [collapsedIncomingCommunicationByRequestId, setCollapsedIncomingCommunicationByRequestId] = useState<Record<string, boolean>>({});
  const [sharePath, setSharePath] = useState<string | null>(null);
  const [editOwnCardModalOpen, setEditOwnCardModalOpen] = useState(false);
  const [deletingOwnCard, setDeletingOwnCard] = useState(false);
  const [ownerActionMessage, setOwnerActionMessage] = useState<string | null>(null);
  const detailPath = useMemo(
    () => (card ? buildCardPathFromCard({ id: card.id, role: card.role, headline: card.headline }) : ''),
    [card],
  );
  const publicCardCode = useMemo(() => {
    return card?.id || '';
  }, [card]);

  useEffect(() => {
    let cancelled = false;

    async function loadSharePath() {
      if (!card) {
        setSharePath(null);
        return;
      }

      const nextSharePath = buildCardSharePathFromCard({
        id: card.id,
      });

      if (!cancelled) {
        setSharePath(nextSharePath);
      }
    }

    void loadSharePath();

    return () => {
      cancelled = true;
    };
  }, [card]);

  useEffect(() => {
    let cancelled = false;

    async function loadCard() {
      setLoading(!fallbackCard);

      const nextCard = await fetchCardById(id);

      if (cancelled) {
        return;
      }

      setCard(nextCard);
      setLoading(false);
    }

    void loadCard();

    return () => {
      cancelled = true;
    };
  }, [fallbackCard, id]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setIntro(profile.user.detailedProfile?.intro || '');
    setEducation(profile.user.detailedProfile?.education || '');
    setExperience(profile.user.detailedProfile?.experience || '');
    setProjectDetail(getRoleSpecificProjectDetail(profile.user.detailedProfile, profile.card?.role));
    setContactPhone(getContactValueByType(profile.contactMethods, 'phone'));
    setContactWechat(getContactValueByType(profile.contactMethods, 'wechat'));
    setContactEmail(getContactValueByType(profile.contactMethods, 'email'));
    setContactQq(getContactValueByType(profile.contactMethods, 'qq'));
    const parsedOther = splitOtherContactValue(getContactValueByType(profile.contactMethods, 'other'));
    setContactDisplayName(parsedOther.displayName || profile.user.displayName || '');
    setContactOther(parsedOther.other);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    async function loadRequestMeta() {
      if (!authenticated) {
        if (!cancelled) {
          setRequestMeta(null);
          setIncomingRequestsForCard([]);
        }
        return;
      }

      try {
        const requestCenter = await fetchMyRequests();

        if (cancelled) {
          return;
        }

        const matchedRequest = card?.viewerState?.requestId ? requestCenter.outgoing.find((item) => item.id === card.viewerState?.requestId) || null : null;
        const incomingByCard = card?.id ? requestCenter.incoming.filter((item) => item.targetCard.id === card.id) : [];

        setRequestMeta(matchedRequest);
        setIncomingRequestsForCard(incomingByCard);
      } catch {
        if (!cancelled) {
          setRequestMeta(null);
          setIncomingRequestsForCard([]);
        }
      }
    }

    void loadRequestMeta();

    return () => {
      cancelled = true;
    };
  }, [authenticated, card?.viewerState?.requestId, card?.id]);

  async function createRequestAndRefreshCard() {
    if (!card?.id) {
      throw new Error('目标卡片不存在');
    }

    await createDetailRequest(
      card.id,
      buildRequestDetailSnapshotPayload({
        intro,
        education,
        experience,
        projectDetail,
      }),
    );
    const nextCard = await fetchCardById(id);

    if (nextCard) {
      setCard(nextCard);
    }
  }

  async function handleSaveDetailOnlyForApproveModal() {
    const localErrors = validateDetailFields({
      intro,
      education,
      experience,
      projectDetail,
    }, projectFieldLabel);

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setIncomingModalMessage('请先修正标红字段后再保存。');
      return;
    }

    setSavingDetail(true);
    setFieldErrors({});
    setIncomingModalMessage(null);
    setMessage(null);

    try {
      await saveDetailProfile(buildDetailProfilePayload(currentUserRole, { intro, education, experience, projectDetail }));
      await refresh();
      setEditingDetailInApproveModal(false);
      setMessage('详细信息已更新，可继续发送申请。');
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      const backendFieldErrors = parseDetailFieldErrorsFromMessage(errorMessage, projectFieldLabel);

      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors((previous) => ({
          ...previous,
          ...backendFieldErrors,
        }));
        setIncomingModalMessage('请先修正标红字段后再保存。');
      } else {
        setIncomingModalMessage(errorMessage);
      }
    } finally {
      setSavingDetail(false);
    }
  }

  async function handleSaveDetailOnly() {
    const localErrors = validateDetailFields({
      intro,
      education,
      experience,
      projectDetail,
    }, projectFieldLabel);

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setModalMessage('请先修正标红字段后再保存。');
      return;
    }

    setSavingDetail(true);
    setFieldErrors({});
    setModalMessage(null);
    setMessage(null);

    try {
      await saveDetailProfile(buildDetailProfilePayload(currentUserRole, { intro, education, experience, projectDetail }));
      await refresh();
      setEditingDetailInRequestModal(false);
      setMessage('详细信息已更新，可继续发送申请。');
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      const backendFieldErrors = parseDetailFieldErrorsFromMessage(errorMessage, projectFieldLabel);

      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors((previous) => ({
          ...previous,
          ...backendFieldErrors,
        }));
        setModalMessage('请先修正标红字段后再保存。');
      } else {
        setModalMessage(errorMessage);
      }
    } finally {
      setSavingDetail(false);
    }
  }

  async function handleCreateRequest() {
    setSubmittingRequest(true);
    setModalMessage(null);
    setMessage(null);

    try {
      await createRequestAndRefreshCard();
      setRequestModalOpen(false);
      setMessage('已成功发起了解详情请求，接下来等待对方先查看并处理。');
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      setModalMessage(errorMessage);
      setMessage(errorMessage);
    } finally {
      setSubmittingRequest(false);
    }
  }

  async function handleSaveDetailAndCreateRequest() {
    const localErrors = validateDetailFields({
      intro,
      education,
      experience,
      projectDetail,
    }, projectFieldLabel);

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setModalMessage('请先修正标红字段后再提交。');
      return;
    }

    setSavingDetail(true);
    setSubmittingRequest(true);
    setFieldErrors({});
    setModalMessage(null);
    setMessage(null);

    try {
      await saveDetailProfile(buildDetailProfilePayload(currentUserRole, { intro, education, experience, projectDetail }));
      await refresh();
      await createRequestAndRefreshCard();
      setRequestModalOpen(false);
      setMessage('详细信息已提交并成功发起申请，接下来等待对方处理。');
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      const backendFieldErrors = parseDetailFieldErrorsFromMessage(errorMessage, projectFieldLabel);

      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors((previous) => ({
          ...previous,
          ...backendFieldErrors,
        }));
        setModalMessage('请先修正标红字段后再提交。');
      } else {
        setModalMessage(errorMessage);
      }

      setMessage(errorMessage);
    } finally {
      setSavingDetail(false);
      setSubmittingRequest(false);
    }
  }

  function openRequestModal() {
    const defaultDetail = requestMeta?.requesterSubmittedDetail || profile?.user.detailedProfile || null;

    setIntro(defaultDetail?.intro || '');
    setEducation(defaultDetail?.education || '');
    setExperience(defaultDetail?.experience || '');
    setProjectDetail(getRoleSpecificProjectDetail(defaultDetail, currentUserRole));
    setFieldErrors({});
    setModalMessage(null);
    setContactValidationMessage(null);
    setEditingDetailInRequestModal(false);
    setRequestModalOpen(true);
  }

  async function refreshRequestsForCurrentCard() {
    if (!authenticated || !card?.id) {
      setIncomingRequestsForCard([]);
      return;
    }

    const requestCenter = await fetchMyRequests();
    const incomingByCard = requestCenter.incoming.filter((item) => item.targetCard.id === card.id);
    const outgoingRequest = card.viewerState?.requestId ? requestCenter.outgoing.find((item) => item.id === card.viewerState?.requestId) || null : null;

    setIncomingRequestsForCard(incomingByCard);
    setRequestMeta(outgoingRequest);

    if (activeIncomingRequest) {
      const matchedIncoming = incomingByCard.find((item) => item.id === activeIncomingRequest.id) || null;
      setActiveIncomingRequest(matchedIncoming);
    }
  }

  async function ensureProfileReadyForReply() {
    const contactValues = [contactPhone, contactWechat, contactEmail, contactQq, contactOther].map((item) => item.trim());
    const hasAnyContact = contactValues.some((item) => item.length > 0);

    if (!hasAnyContact) {
      const text = '请至少填写 1 项联系方式，方便后续双向交换。';
      setContactValidationMessage(text);
      setIncomingModalMessage(text);
      return false;
    }

    setContactValidationMessage(null);

    const hasProfileReady = Boolean(profile?.completion.hasDetailProfile && profile.user.detailedProfile);

    if (hasProfileReady) {
      await saveContactMethods({
        phone: contactPhone.trim(),
        wechat: contactWechat.trim(),
        email: contactEmail.trim(),
        qq: contactQq.trim(),
        other: composeOtherContactValue(contactDisplayName, contactOther),
      });
      await refresh();
      return true;
    }

    const localErrors = validateDetailFields({
      intro,
      education,
      experience,
      projectDetail,
    }, projectFieldLabel);

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setIncomingModalMessage('请先完善你的详细信息后再继续。');
      return false;
    }

    await saveDetailProfile(buildDetailProfilePayload(currentUserRole, { intro, education, experience, projectDetail }));
    await saveContactMethods({
      phone: contactPhone.trim(),
      wechat: contactWechat.trim(),
      email: contactEmail.trim(),
      qq: contactQq.trim(),
      other: composeOtherContactValue(contactDisplayName, contactOther),
    });
    await refresh();
    return true;
  }

  async function handleOpenExchangeContactModal() {
    if (!requestMeta) {
      return;
    }

    setExchangeModalMessage(null);
    setContactValidationMessage(null);
    setExchangeJustCompleted(false);
    setJustExchangedPublisherContacts([]);
    setExchangeRejectReason(
      '感谢你提供这么完整的信息，也谢谢你的耐心。我们评估后觉得当前合作时机还不够合适，这次先不联系了。后续如果出现更匹配的方向，期待再沟通。',
    );

    try {
      await markExchangeReviewing(requestMeta.id);
      await refreshRequestsForCurrentCard();
    } catch (error) {
      setMessage(extractErrorMessage(error));
      return;
    }

    setExchangeContactModalOpen(true);
  }

  async function handleConfirmExchangeContact() {
    if (!requestMeta) {
      return;
    }

    if (![contactPhone, contactWechat, contactEmail, contactQq, contactOther].some((item) => item.trim().length > 0)) {
      const text = '请至少填写 1 项联系方式。';
      setContactValidationMessage(text);
      setExchangeModalMessage(text);
      return;
    }

    setSavingExchangeContact(true);
    setExchangeModalMessage(null);
    setContactValidationMessage(null);

    try {
      await saveContactMethods({
        phone: contactPhone.trim(),
        wechat: contactWechat.trim(),
        email: contactEmail.trim(),
        qq: contactQq.trim(),
        other: composeOtherContactValue(contactDisplayName, contactOther),
      });
      await refresh();
      const exchangedRequest = await exchangeContact(requestMeta.id);
      await refreshRequestsForCurrentCard();
      const nextCard = await fetchCardById(id);

      if (nextCard) {
        setCard(nextCard);
      }

      if ('publisher' in exchangedRequest) {
        setJustExchangedPublisherContacts(exchangedRequest.publisher.contactMethods);
      }

      setExchangeJustCompleted(true);
      setExchangeModalMessage('交换成功，双方现在可以直接看到彼此联系方式。');
      setMessage('已完成联系方式交换，双方现在可以看到彼此联系方式。');
    } catch (error) {
      setExchangeModalMessage(extractErrorMessage(error));
    } finally {
      setSavingExchangeContact(false);
    }
  }

  async function handleDeclineExchangeContact() {
    if (!requestMeta) {
      return;
    }

    const finalReason = exchangeRejectReason.trim();

    if (finalReason.length < 8) {
      setExchangeModalMessage('不想联系的说明请再具体一点，避免造成误解。');
      return;
    }

    setSavingExchangeContact(true);
    setExchangeModalMessage(null);

    try {
      await declineContact(requestMeta.id, finalReason);
      await refreshRequestsForCurrentCard();
      const nextCard = await fetchCardById(id);

      if (nextCard) {
        setCard(nextCard);
      }

      setExchangeContactModalOpen(false);
      setMessage('已记录你的“不想联系”选择。当前状态已更新为“不想联系”。');
    } catch (error) {
      const riskReview = extractRiskReview(error);

      if (riskReview) {
        const confirmed = window.confirm(
          `系统检测到潜在风险内容。\n风险等级：${riskReview.riskLevel}\n命中类别：${riskReview.categories.join('、') || '未知'}\n命中词：${riskReview.matchedTerms.join('、') || '未知'}\n\n是否仍继续发布？`,
        );

        if (confirmed) {
          try {
            await declineContact(requestMeta.id, finalReason, true);
            await refreshRequestsForCurrentCard();
            const nextCard = await fetchCardById(id);

            if (nextCard) {
              setCard(nextCard);
            }

            setExchangeContactModalOpen(false);
            setMessage('已按你的确认记录“不想联系”，管理员会优先审核风险内容。');
            return;
          } catch (retryError) {
            setExchangeModalMessage(extractErrorMessage(retryError));
            return;
          }
        }

        setExchangeModalMessage('你已取消本次操作。');
        return;
      }

      setExchangeModalMessage(extractErrorMessage(error));
    } finally {
      setSavingExchangeContact(false);
    }
  }

  async function handleOpenRequesterDetail(request: IncomingRequest) {
    setPendingIncomingActionRequestId(request.id);
    setIncomingModalMessage(null);

    try {
      let nextRequest = request;

      if (request.actions.canViewRequesterDetail) {
        nextRequest = await viewRequesterDetail(request.id);
      }

      await refreshRequestsForCurrentCard();
      setActiveIncomingRequest(nextRequest);
      setRequesterDetailModalOpen(true);
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setPendingIncomingActionRequestId(null);
    }
  }

  async function handleApproveIncomingRequest() {
    if (!activeIncomingRequest) {
      return;
    }

    setPendingIncomingActionRequestId(activeIncomingRequest.id);
    setIncomingModalMessage(null);
    setFieldErrors({});

    try {
      const ready = await ensureProfileReadyForReply();

      if (!ready) {
        return;
      }

      await approveDetailRequest(activeIncomingRequest.id);
      await refreshRequestsForCurrentCard();
      setProcessedActionAtByRequestId((previous) => ({
        ...previous,
        [activeIncomingRequest.id]: new Date().toISOString(),
      }));
      setApproveRequestModalOpen(false);
      setRequesterDetailModalOpen(false);
      setActiveIncomingRequest(null);
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      const backendFieldErrors = parseDetailFieldErrorsFromMessage(errorMessage, projectFieldLabel);

      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors((previous) => ({
          ...previous,
          ...backendFieldErrors,
        }));
        setIncomingModalMessage('请先修正标红字段后再提交。');
      } else {
        setIncomingModalMessage(errorMessage);
      }
    } finally {
      setPendingIncomingActionRequestId(null);
    }
  }

  async function handleStartApproveFlow(request: IncomingRequest) {
    setPendingIncomingActionRequestId(request.id);
    setIncomingModalMessage(null);
    setContactValidationMessage(null);
    setEditingDetailInApproveModal(false);

    try {
      let nextRequest = request;

      if (request.actions.canViewRequesterDetail) {
        nextRequest = await viewRequesterDetail(request.id);
      }

      await refreshRequestsForCurrentCard();
      setActiveIncomingRequest(nextRequest);
      setFieldErrors({});
      setApproveRequestModalOpen(true);
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setPendingIncomingActionRequestId(null);
    }
  }

  async function handleRejectIncomingRequest() {
    if (!activeIncomingRequest) {
      return;
    }

    const finalReason = rejectReason.trim();

    if (finalReason.length < 8) {
      setIncomingModalMessage('拒绝理由再写具体一点，会更体面，也能减少误会。');
      return;
    }

    setPendingIncomingActionRequestId(activeIncomingRequest.id);
    setIncomingModalMessage(null);

    try {
      await rejectDetailRequest(activeIncomingRequest.id, finalReason);
      await refreshRequestsForCurrentCard();
      setProcessedActionAtByRequestId((previous) => ({
        ...previous,
        [activeIncomingRequest.id]: new Date().toISOString(),
      }));
      setRejectRequestModalOpen(false);
      setRequesterDetailModalOpen(false);
      setActiveIncomingRequest(null);
    } catch (error) {
      const riskReview = extractRiskReview(error);

      if (riskReview && activeIncomingRequest) {
        const confirmed = window.confirm(
          `系统检测到潜在风险内容。\n风险等级：${riskReview.riskLevel}\n命中类别：${riskReview.categories.join('、') || '未知'}\n命中词：${riskReview.matchedTerms.join('、') || '未知'}\n\n是否仍继续发布？`,
        );

        if (confirmed) {
          try {
            await rejectDetailRequest(activeIncomingRequest.id, finalReason, true);
            await refreshRequestsForCurrentCard();
            setProcessedActionAtByRequestId((previous) => ({
              ...previous,
              [activeIncomingRequest.id]: new Date().toISOString(),
            }));
            setRejectRequestModalOpen(false);
            setRequesterDetailModalOpen(false);
            setActiveIncomingRequest(null);
            return;
          } catch (retryError) {
            setIncomingModalMessage(extractErrorMessage(retryError));
            return;
          }
        }

        setIncomingModalMessage('你已取消本次操作。');
        return;
      }

      setIncomingModalMessage(extractErrorMessage(error));
    } finally {
      setPendingIncomingActionRequestId(null);
    }
  }

  if (loading && !card) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>正在加载资料…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">请稍候。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>未找到该卡片</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">这张公开卡片暂时不可查看。</p>
            <Link className={buttonVariants()} href="/projects">
            返回公开列表
          </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = card.viewerState ? viewerStatusLabels[card.viewerState.status] || card.viewerState.status : null;
  const backToListHref = card.role === 'expert' ? '/projects' : '/developers';
  const backToListLabel = card.role === 'expert' ? '返回项目列表' : '返回程序员列表';
  const targetRoleLabel = card.role === 'expert' ? '项目方' : '程序员';
  const currentUserRole: UserRole = profile?.card?.role ?? (card.role === 'expert' ? 'developer' : 'expert');
  const projectFieldLabel = getProjectFieldLabel(currentUserRole);
  const projectFieldPlaceholder = getProjectFieldPlaceholder(currentUserRole);
  const hasDetailProfile = Boolean(profile?.completion.hasDetailProfile && profile.user.detailedProfile);
  const profilePreviewRows = buildDetailRows(profile?.user.detailedProfile, currentUserRole, '未填写');
  const requestDraftRows = buildDetailRows({ intro, education, experience, projectDetail }, currentUserRole, '未填写');
  const submittedRequestRows = buildDetailRows(requestMeta?.requesterSubmittedDetail, currentUserRole, '未填写');
  const alertText = hasDetailProfile
    ? '小提醒：先把下面这些信息发给对方，对方会更放心，也更愿意继续聊下去。'
    : '小提醒：先花几分钟把下面的信息补充一下发给对方，对方会更放心，也更愿意继续聊下去。';
  const alertSubText = '这些信息只会在你点击“提交申请”后发送给对方。';
  const noVisibleContactsHint = requestMeta?.status === 'contact_exchanged'
    ? '对方尚未填写联系方式，暂时无法查看。'
    : '你填写得越清楚，对方越容易判断你们是否合适，也就更可能把更多信息开放给你。';
  const outgoingVisibleContacts = requestMeta?.status === 'contact_exchanged' ? requestMeta.publisher.contactMethods : [];
  const outgoingVisibleContactItems = normalizeContactDisplayItems(outgoingVisibleContacts, 'outgoing-visible');
  const isOwnCard = Boolean(authenticated && profile?.user.id && card.ownerId && profile.user.id === card.ownerId);
  const incomingRequestsSorted = [...incomingRequestsForCard].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const hasIncomingMatchedSuccess = incomingRequestsSorted.some((request) => request.status === 'contact_exchanged');
  const publisherDetailRows = buildDetailRows(requestMeta?.publisher.detailedProfile, card.role, '暂未开放');
  const communicationLogs = (() => {
    if (!requestMeta) {
      return [] as Array<{ id: string; at: string; tone: 'neutral' | 'info' | 'success' | 'warning'; text: string }>;
    }

    const logs: Array<{ id: string; at: string; tone: 'neutral' | 'info' | 'success' | 'warning'; text: string }> = [
      {
        id: 'outgoing-created',
        at: requestMeta.createdAt,
        tone: 'neutral',
        text: '你发送了“询问更多信息”申请，并提交了你的详细信息。',
      },
    ];

    if (requestMeta.publisherViewedRequesterDetailAt) {
      logs.push({
        id: 'outgoing-viewed',
        at: requestMeta.publisherViewedRequesterDetailAt,
        tone: 'info',
        text: '对方已阅读你的信息，正在考虑回复。',
      });
    }

    if (requestMeta.exchangeReviewingAt) {
      logs.push({
        id: 'outgoing-exchange-reviewing',
        at: requestMeta.exchangeReviewingAt,
        tone: 'info',
        text: '已查看和Ta聊聊的申请，正在考虑如何回复。',
      });
    }

    if (requestMeta.approvedAt) {
      logs.push({
        id: 'outgoing-approved',
        at: requestMeta.approvedAt,
        tone: 'success',
        text: '对方已同意继续沟通，并向你开放了更多信息。',
      });
    }

    if (requestMeta.contactExchangedAt) {
      logs.push({
        id: 'outgoing-contact',
        at: requestMeta.contactExchangedAt,
        tone: 'success',
        text: '你已完成交换联系方式。现在双方均可查看彼此联系方式。尽情沟通吧！',
      });
    }

    if (requestMeta.status === 'rejected' && requestMeta.rejectionReason) {
      logs.push({
        id: 'outgoing-rejected',
        at: requestMeta.rejectedAt || requestMeta.publisherViewedRequesterDetailAt || requestMeta.createdAt,
        tone: 'warning',
        text: `对方反馈本次暂不继续：${requestMeta.rejectionReason}`,
      });
    }

    if (requestMeta.requesterDeclinedContactAt) {
      logs.push({
        id: 'outgoing-self-decline',
        at: requestMeta.requesterDeclinedContactAt,
        tone: 'warning',
        text: `你选择了“不想联系”：${requestMeta.rejectionReason || '已记录你的选择。'}`,
      });
    }

    return logs.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  })();

  function handleEditOwnCard() {
    setOwnerActionMessage(null);
    setEditOwnCardModalOpen(true);
  }

  function handleOpenContactDisclosure(key: string) {
    setPendingContactRevealKey(key);
    setContactDisclosureModalOpen(true);
  }

  function handleAcceptContactDisclosure() {
    if (!pendingContactRevealKey) {
      return;
    }

    setRevealedContactValuesByKey((previous) => ({
      ...previous,
      [pendingContactRevealKey]: true,
    }));
    setPendingContactRevealKey(null);
    setContactDisclosureModalOpen(false);
  }

  function handleCloseContactDisclosure() {
    setPendingContactRevealKey(null);
    setContactDisclosureModalOpen(false);
  }

  function handleHideContactValue(key: string) {
    setRevealedContactValuesByKey((previous) => ({
      ...previous,
      [key]: false,
    }));
  }

  async function handleDeleteOwnCard() {
    if (!card) {
      return;
    }

    const confirmed = window.confirm(`确认删除「${card.headline}」吗？删除后将无法恢复。`);

    if (!confirmed) {
      return;
    }

    setDeletingOwnCard(true);
    setOwnerActionMessage(null);

    try {
      await deleteMyCard(card.id);
      await refresh();
      router.replace(backToListHref);
    } catch (error) {
      setOwnerActionMessage(extractErrorMessage(error));
    } finally {
      setDeletingOwnCard(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-6 overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_10%_0%,rgba(19,191,168,0.16),transparent_48%),radial-gradient(circle_at_90%_18%,rgba(76,200,255,0.14),transparent_46%)]" />

      <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm">
        <Link className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'px-0')} href={backToListHref}>
          ← {backToListLabel}
        </Link>
      </div>

      <section className="relative space-y-4 rounded-2xl border border-border/70 bg-card/84 p-6 shadow-[0_16px_38px_rgba(79,108,163,0.14)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{roleLabels[card.role]}</span>
          <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">{card.city}</span>
        </div>
        <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">{card.headline}</h1>
        <p className="text-xs text-muted-foreground">{formatPublishedAt(card.updatedAt, card.ownerName)}</p>
        <p className="text-xs text-muted-foreground">编号：{publicCardCode}</p>
        <p className="text-sm leading-7 text-muted-foreground">{card.basicSummary}</p>
        <div className="flex flex-wrap gap-2">
          {card.strengths.map((strength) => (
            <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground" key={strength}>
              {strength}
            </span>
          ))}
        </div>
        <div className="rounded-xl border border-border/60 bg-background/74 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CardEngagementActions card={{ id: card.id, role: card.role, headline: card.headline }} sharePath={sharePath} />
            </div>
            {!authenticated ? (
              <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'ml-auto')} href={`/login?next=${encodeURIComponent(detailPath)}`}>
                询问更多信息
              </Link>
            ) : card.viewerState ? (
              <div className="ml-auto flex items-center gap-2">
                <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', getViewerStatusBadgeClass(card.viewerState.status))}>当前状态：{statusLabel}</span>
                {requestMeta?.actions.canExchangeContact ? (
                  <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))} type="button" onClick={() => void handleOpenExchangeContactModal()}>
                    {requestMeta.status === 'requester_declined_contact' ? '后悔了，重新联系' : '交换联系方式'}
                  </button>
                ) : null}
              </div>
            ) : isOwnCard ? (
              <div className="ml-auto hidden items-center justify-end gap-2 sm:flex">
                <button
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'h-9 rounded-full border-sky-200/80 bg-sky-50/85 px-4 text-sm font-medium text-sky-700 hover:bg-sky-100/90 hover:text-sky-800',
                  )}
                  type="button"
                  onClick={handleEditOwnCard}
                >
                  修改
                </button>
                <button
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'h-9 rounded-full border-rose-200/85 bg-rose-50/80 px-4 text-sm font-medium text-rose-600 hover:bg-rose-100/90 hover:text-rose-700',
                  )}
                  disabled={deletingOwnCard}
                  type="button"
                  onClick={handleDeleteOwnCard}
                >
                  {deletingOwnCard ? '删除中…' : '删除'}
                </button>
              </div>
            ) : (
              <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'ml-auto')} disabled={submittingRequest || savingDetail} type="button" onClick={openRequestModal}>
                {submittingRequest ? '发送中…' : '询问更多信息'}
              </button>
            )}
          </div>
        </div>
      </section>

      {isOwnCard ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
          <button
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-9 w-full rounded-full border-sky-200/80 bg-sky-50/85 px-3 text-sm font-medium text-sky-700 hover:bg-sky-100/90 hover:text-sky-800',
            )}
            type="button"
            onClick={handleEditOwnCard}
          >
            修改
          </button>
          <button
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-9 w-full rounded-full border-rose-200/85 bg-rose-50/80 px-3 text-sm font-medium text-rose-600 hover:bg-rose-100/90 hover:text-rose-700',
            )}
            disabled={deletingOwnCard}
            type="button"
            onClick={handleDeleteOwnCard}
          >
            {deletingOwnCard ? '删除中…' : '删除'}
          </button>
        </div>
      ) : null}

      {isOwnCard && ownerActionMessage ? <p className="mt-2 text-xs text-muted-foreground">{ownerActionMessage}</p> : null}

      {isOwnCard && hasIncomingMatchedSuccess ? (
        <section className="rounded-2xl border border-emerald-300/60 bg-gradient-to-r from-emerald-50/85 via-teal-50/80 to-cyan-50/80 p-3 shadow-[0_10px_24px_rgba(6,95,70,0.12)]">
          <div className="grid gap-2 md:grid-cols-2">
            <button
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-11 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-rose-50 text-sm font-semibold text-amber-900 shadow-[0_8px_20px_rgba(146,64,14,0.14)] transition-transform hover:scale-[1.01] hover:from-amber-100 hover:to-rose-100',
              )}
              type="button"
              onClick={() => setRiskNoticeModalOpen(true)}
            >
              ⚠️ 风险提示（必读）
            </button>
            <button
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-11 rounded-xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 to-teal-50 text-sm font-semibold text-emerald-900 shadow-[0_8px_20px_rgba(6,95,70,0.12)] transition-transform hover:scale-[1.01] hover:from-emerald-100 hover:to-teal-100',
              )}
              type="button"
              onClick={() => setMvpGuideModalOpen(true)}
            >
              🚀 MVP建议（推荐）
            </button>
          </div>
        </section>
      ) : null}

      {isOwnCard && editOwnCardModalOpen && card ? (
        <div aria-label="修改卡片" aria-modal="true" className="fixed inset-0 z-[130] overflow-y-auto p-4" role="dialog">
          <button className="fixed inset-0 bg-foreground/30" type="button" aria-label="关闭修改卡片弹框" onClick={() => setEditOwnCardModalOpen(false)} />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="w-full max-w-3xl rounded-2xl border border-border/70 bg-card/96 p-4 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md md:p-5">
              <CardPublishForm
                role={card.role}
                mode="edit"
                cardId={card.id}
                initialValues={{
                  headline: card.headline,
                  basicSummary: card.basicSummary,
                  city: card.city,
                  strengths: card.strengths,
                }}
                loginNext={detailPath}
                successRedirect={detailPath}
                presentation="modal"
                onCancel={() => setEditOwnCardModalOpen(false)}
                onSuccess={() => {
                  setEditOwnCardModalOpen(false);
                  setOwnerActionMessage('修改已保存。');
                  void (async () => {
                    const nextCard = await fetchCardById(id);

                    if (nextCard) {
                      setCard(nextCard);
                    }
                  })();
                }}
              />
            </section>
          </div>
        </div>
      ) : null}

      {requestMeta?.status === 'contact_exchanged' ? (
        <section className="space-y-3 rounded-2xl border border-emerald-300/70 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-5 shadow-[0_16px_36px_rgba(16,185,129,0.2)]">
          <h2 className="text-2xl font-semibold text-emerald-900">🎉 匹配成功：对方联系方式</h2>
          {outgoingVisibleContactItems.length > 0 ? (
            <div className="grid gap-2">
              {outgoingVisibleContactItems.map((contact) => {
                const revealed = revealedContactValuesByKey[contact.id] || false;

                return (
                  <div className="rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3" key={contact.id}>
                    <strong className="text-base font-semibold text-emerald-900">{contact.label}</strong>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="break-words text-base text-emerald-800">{revealed ? contact.value : maskContactValue(contact.value)}</p>
                      {revealed ? (
                        <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2 text-xs')} type="button" onClick={() => handleHideContactValue(contact.id)}>
                          隐藏
                        </button>
                      ) : (
                        <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2 text-xs')} type="button" onClick={() => handleOpenContactDisclosure(contact.id)}>
                          查看
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">{noVisibleContactsHint}</p>
          )}
          <div className="mt-2 grid gap-3 border-t border-emerald-300/50 pt-4 md:grid-cols-2">
            <button
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-12 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-rose-50 text-base font-semibold text-amber-900 shadow-[0_8px_20px_rgba(146,64,14,0.14)] transition-transform hover:scale-[1.01] hover:from-amber-100 hover:to-rose-100',
              )}
              type="button"
              onClick={() => setRiskNoticeModalOpen(true)}
            >
              ⚠️ 风险提示（必读）
            </button>
            <button
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-12 rounded-xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 to-teal-50 text-base font-semibold text-emerald-900 shadow-[0_8px_20px_rgba(6,95,70,0.12)] transition-transform hover:scale-[1.01] hover:from-emerald-100 hover:to-teal-100',
              )}
              type="button"
              onClick={() => setMvpGuideModalOpen(true)}
            >
              🚀 MVP建议（推荐）
            </button>
          </div>
        </section>
      ) : null}

      {isOwnCard ? (
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/84 p-5 shadow-[0_14px_34px_rgba(79,108,163,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-foreground">收到的申请</h2>
            <span className="text-xs text-muted-foreground">共 {incomingRequestsSorted.length} 条</span>
          </div>

          {incomingRequestsSorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">当前项目还没有收到新的申请。</p>
          ) : (
            <div className="grid gap-3">
              {incomingRequestsSorted.map((request) => {
                const requesterName = request.requester.displayName?.trim() || '未知用户';
                const busy = pendingIncomingActionRequestId === request.id;
                const requestStatusLabel = getIncomingRequestStatusLabel(request.status);
                const hasViewedRequesterDetail = Boolean(request.publisherViewedRequesterDetailAt);
                const communicationCollapsed = collapsedIncomingCommunicationByRequestId[request.id] || false;
                const incomingVisibleContactItems =
                  request.status === 'contact_exchanged' ? normalizeContactDisplayItems(request.requester.contactMethods, `incoming-visible-${request.id}`) : [];
                const requesterRole: UserRole = request.targetCard.role === 'expert' ? 'developer' : 'expert';
                const requesterDetailRows = buildDetailRows(request.requester.detailedProfile, requesterRole, '暂未查看');
                const incomingCommunicationLogs = (() => {
                  const logs: Array<{ id: string; at: string; tone: 'neutral' | 'info' | 'success' | 'warning'; text: string; canExpandInfo?: boolean; detailRows?: ReadonlyArray<readonly [string, string]> }> = [
                    {
                      id: `incoming-created-${request.id}`,
                      at: request.createdAt,
                      tone: 'neutral',
                      text: 'developer 向你发送了“询问更多信息”申请，并提交了详细信息。',
                      canExpandInfo: true,
                      detailRows: requesterDetailRows,
                    },
                  ];

                  if (request.publisherViewedRequesterDetailAt) {
                    logs.push({
                      id: `incoming-viewed-${request.id}`,
                      at: request.publisherViewedRequesterDetailAt,
                      tone: 'info',
                      text: '你已阅读对方信息，正在考虑回复。',
                    });
                  }

                  if (request.exchangeReviewingAt) {
                    logs.push({
                      id: `incoming-exchange-reviewing-${request.id}`,
                      at: request.exchangeReviewingAt,
                      tone: 'info',
                      text: '已查看和Ta聊聊的申请，正在考虑如何回复。',
                    });
                  }

                  if (request.approvedAt) {
                    logs.push({
                      id: `incoming-approved-${request.id}`,
                      at: request.approvedAt,
                      tone: 'success',
                      text: '你已点击“和Ta聊聊”，并向对方开放了更多信息。',
                      canExpandInfo: true,
                      detailRows: profilePreviewRows,
                    });
                  }

                  if (request.contactExchangedAt) {
                    logs.push({
                      id: `incoming-contact-${request.id}`,
                      at: request.contactExchangedAt,
                      tone: 'success',
                      text: '你已完成交换联系方式。现在双方均可查看彼此联系方式。尽情沟通吧！',
                    });
                  }

                  if (request.status === 'rejected') {
                    logs.push({
                      id: `incoming-rejected-${request.id}`,
                      at: processedActionAtByRequestId[request.id] || request.createdAt,
                      tone: 'warning',
                      text: '你已选择“不感兴趣”，本次沟通暂不继续。',
                    });
                  }

                  if (request.status === 'requester_declined_contact') {
                    logs.push({
                      id: `incoming-requester-declined-${request.id}`,
                      at: request.requesterDeclinedContactAt || request.exchangeReviewingAt || request.createdAt,
                      tone: 'warning',
                      text: `对方选择了“不想联系”：${request.rejectionReason || '已记录。'}`,
                    });
                  }

                  return logs.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
                })();

                return (
                  <article className="space-y-2 rounded-xl border border-border/60 bg-background/70 p-4" key={request.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-foreground">
                      <strong>#{incomingRequestsSorted.findIndex((item) => item.id === request.id) + 1} 收到 {requesterName} 的请求</strong>
                      <button
                        className={buttonVariants({ size: 'sm' })}
                        disabled={busy}
                        type="button"
                        onClick={() => void handleOpenRequesterDetail(request)}
                      >
                        {busy ? '加载中…' : '查看详情'}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">申请时间：{formatDateTime(request.createdAt)}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', getIncomingRequestStatusBadgeClass(request.status))}>
                        {requestStatusLabel}
                      </span>
                      {request.status === 'rejected' ? (
                        <button className={buttonVariants({ variant: 'outline', size: 'sm' })} type="button" onClick={() => void handleStartApproveFlow(request)}>
                          后悔了，我想和Ta聊聊
                        </button>
                      ) : null}
                    </div>

                    {request.status === 'contact_exchanged' ? (
                      <section className="space-y-2 rounded-xl border border-emerald-300/65 bg-emerald-50/80 p-3">
                        <h3 className="text-sm font-semibold text-emerald-900">对方联系方式</h3>
                        {incomingVisibleContactItems.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {incomingVisibleContactItems.map((contact) => {
                              const revealed = revealedContactValuesByKey[contact.id] || false;

                              return (
                                <div className="rounded-md border border-emerald-300/60 bg-white/90 px-3 py-2" key={contact.id}>
                                  <p className="text-xs font-medium text-emerald-900">{contact.label}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <p className="break-words text-sm text-emerald-800">{revealed ? contact.value : maskContactValue(contact.value)}</p>
                                    {revealed ? (
                                      <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2 text-xs')} type="button" onClick={() => handleHideContactValue(contact.id)}>
                                        隐藏
                                      </button>
                                    ) : (
                                      <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2 text-xs')} type="button" onClick={() => handleOpenContactDisclosure(contact.id)}>
                                        查看
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="rounded-md border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">对方尚未填写联系方式，暂时无法查看。</p>
                        )}
                      </section>
                    ) : null}

                    <section className="space-y-2 rounded-xl border border-sky-300/60 bg-sky-50/65 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-sky-900">沟通记录</h3>
                        <button
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2 text-xs')}
                          type="button"
                          onClick={() => {
                            setCollapsedIncomingCommunicationByRequestId((previous) => ({
                              ...previous,
                              [request.id]: !communicationCollapsed,
                            }));
                          }}
                        >
                          {communicationCollapsed ? '展开记录' : '折叠记录'}
                        </button>
                      </div>
                      {!communicationCollapsed ? (
                        <div className="grid gap-2">
                          {incomingCommunicationLogs.map((log) => {
                            const expanded = expandedCommunicationInfoById[log.id] || false;

                            return (
                              <div
                                className={cn(
                                  'rounded-lg border px-3 py-2',
                                  log.tone === 'success' && 'border-emerald-300/60 bg-emerald-50/70 text-emerald-900',
                                  log.tone === 'info' && 'border-sky-300/60 bg-sky-50/80 text-sky-900',
                                  log.tone === 'warning' && 'border-amber-300/60 bg-amber-50/80 text-amber-900',
                                  log.tone === 'neutral' && 'border-slate-300/60 bg-white/85 text-slate-700',
                                )}
                                key={log.id}
                              >
                                <p className="text-xs opacity-80">{formatDateTime(log.at)}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className="text-sm leading-6">{log.text}</span>
                                  {log.canExpandInfo ? (
                                    <button
                                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2 text-xs')}
                                      type="button"
                                      onClick={() => {
                                        if (log.id === `incoming-created-${request.id}` && !hasViewedRequesterDetail) {
                                          void handleOpenRequesterDetail(request);
                                          return;
                                        }

                                        setExpandedCommunicationInfoById((previous) => ({ ...previous, [log.id]: !expanded }));
                                      }}
                                    >
                                      {expanded ? '收起信息' : '查看信息'}
                                    </button>
                                  ) : null}
                                </div>
                                {log.canExpandInfo && expanded ? (
                                  <div className="mt-2 grid gap-2 rounded-lg border border-sky-300/40 bg-white/70 p-2">
                                    {log.detailRows?.map(([label, value]) => (
                                      <div className="rounded-md border border-border/50 bg-background/85 p-2" key={`incoming-log-${log.id}-${label}`}>
                                        <p className="text-xs font-medium text-foreground">{label}</p>
                                        <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">{value}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {requestMeta ? (
        <section className="space-y-3 rounded-2xl border border-sky-300/60 bg-sky-50/70 p-5 shadow-[0_14px_30px_rgba(43,109,167,0.12)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-sky-900">沟通记录</h2>
          </div>
          <div className="grid gap-2">
            {communicationLogs.map((log) => {
              const canExpandInfo = log.id === 'outgoing-approved' || log.id === 'outgoing-created';
              const expanded = expandedCommunicationInfoById[log.id] || false;
              const detailRowsToShow = log.id === 'outgoing-created' ? submittedRequestRows : publisherDetailRows;

              return (
                <div
                  className={cn(
                    'rounded-lg border px-3 py-2',
                    log.tone === 'success' && 'border-emerald-300/60 bg-emerald-50/70 text-emerald-900',
                    log.tone === 'info' && 'border-sky-300/60 bg-sky-50/80 text-sky-900',
                    log.tone === 'warning' && 'border-amber-300/60 bg-amber-50/80 text-amber-900',
                    log.tone === 'neutral' && 'border-slate-300/60 bg-white/85 text-slate-700',
                  )}
                  key={log.id}
                >
                  <p className="text-xs opacity-80">{formatDateTime(log.at)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm leading-6">{log.text}</span>
                    {canExpandInfo ? (
                      <button
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2 text-xs')}
                        type="button"
                        onClick={() => setExpandedCommunicationInfoById((previous) => ({ ...previous, [log.id]: !expanded }))}
                      >
                        {expanded ? '收起信息' : '查看信息'}
                      </button>
                    ) : null}
                    {log.id === 'outgoing-self-decline' && requestMeta.actions.canExchangeContact ? (
                      <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2 text-xs')} type="button" onClick={() => void handleOpenExchangeContactModal()}>
                        后悔了，重新联系
                      </button>
                    ) : null}
                  </div>
                  {canExpandInfo && expanded ? (
                    <div className="mt-2 grid gap-2 rounded-lg border border-sky-300/40 bg-white/70 p-2">
                      {detailRowsToShow.map(([label, value]) => (
                        <div className="rounded-md border border-border/50 bg-background/85 p-2" key={`log-${log.id}-${label}`}>
                          <p className="text-xs font-medium text-foreground">{label}</p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {requestModalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="询问更多信息">
          <button className="fixed inset-0 bg-foreground/30" onClick={() => setRequestModalOpen(false)} type="button" aria-label="关闭弹框" />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="max-h-[calc(100vh-2rem)] supports-[height:100dvh]:max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
            <h2 className="text-xl font-semibold text-foreground">询问更多信息</h2>
            <div className="request-modal-alert">
              <p className="request-modal-alert-text">
                {alertText}
                <br />
                {alertSubText}
              </p>
              <details className="request-modal-help">
                <summary aria-label="为什么要先提供详细信息">
                  ?
                </summary>
                <div className="request-modal-help-popover">
                  <p>
                    说实话，{targetRoleLabel}的详细信息里，常常会有业务细节、项目进度，或者一些不太方便公开的内容。你先把自己的背景和合作方式讲清楚，对方才能判断你们是不是一路人。
                  </p>
                  <p>先给诚意，再谈深入，彼此都更安心，合作也更容易走下去。</p>
                </div>
              </details>
            </div>

            {hasDetailProfile ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">以下信息将会被提交给对方：</p>
                  {!editingDetailInRequestModal ? (
                    <button
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 px-3 text-xs')}
                      disabled={submittingRequest || savingDetail}
                      type="button"
                      onClick={() => {
                        setFieldErrors({});
                        setModalMessage(null);
                        setEditingDetailInRequestModal(true);
                      }}
                    >
                      修改
                    </button>
                  ) : null}
                </div>

                {editingDetailInRequestModal ? (
                  <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
                    <label className="grid gap-1 text-sm text-foreground">
                      个人简介
                      <Textarea
                        className={cn(fieldErrors.intro ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                        name="intro"
                        onChange={(event) => {
                          setIntro(event.target.value);
                          setFieldErrors((previous) => ({ ...previous, intro: getDetailFieldError('intro', event.target.value) }));
                        }}
                        rows={3}
                        placeholder="请避免泄漏个人隐私及联系方式。"
                        value={intro}
                      />
                      {fieldErrors.intro ? <span className="text-xs text-destructive">{fieldErrors.intro}</span> : null}
                    </label>
                    <label className="grid gap-1 text-sm text-foreground">
                      教育背景
                      <Textarea
                        className={cn(fieldErrors.education ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                        name="education"
                        onChange={(event) => {
                          setEducation(event.target.value);
                          setFieldErrors((previous) => ({ ...previous, education: getDetailFieldError('education', event.target.value) }));
                        }}
                        rows={2}
                        placeholder="请概要介绍下学校、专业等情况，或许能遇到校友。"
                        value={education}
                      />
                      {fieldErrors.education ? <span className="text-xs text-destructive">{fieldErrors.education}</span> : null}
                    </label>
                    <label className="grid gap-1 text-sm text-foreground">
                      工作背景
                      <Textarea
                        className={cn(fieldErrors.experience ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                        name="experience"
                        onChange={(event) => {
                          setExperience(event.target.value);
                          setFieldErrors((previous) => ({ ...previous, experience: getDetailFieldError('experience', event.target.value) }));
                        }}
                        rows={3}
                        placeholder="请概要介绍工作经历和职责，这对创业伙伴了解你非常重要。"
                        value={experience}
                      />
                      {fieldErrors.experience ? <span className="text-xs text-destructive">{fieldErrors.experience}</span> : null}
                    </label>
                    <label className="grid gap-1 text-sm text-foreground">
                      {projectFieldLabel}
                      <Textarea
                        className={cn(fieldErrors.projectDetail ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                        name="projectDetail"
                        onChange={(event) => {
                          setProjectDetail(event.target.value);
                          setFieldErrors((previous) => ({ ...previous, projectDetail: getDetailFieldError('projectDetail', event.target.value, projectFieldLabel) }));
                        }}
                        rows={4}
                        placeholder={projectFieldPlaceholder}
                        value={projectDetail}
                      />
                      {fieldErrors.projectDetail ? <span className="text-xs text-destructive">{fieldErrors.projectDetail}</span> : null}
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button className={buttonVariants({ size: 'sm' })} disabled={savingDetail || submittingRequest} type="button" onClick={() => void handleSaveDetailOnly()}>
                        {savingDetail ? '保存中…' : '保存修改'}
                      </button>
                      <button
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                        disabled={savingDetail || submittingRequest}
                        type="button"
                        onClick={() => {
                          const defaultDetail = requestMeta?.requesterSubmittedDetail || profile?.user.detailedProfile || null;
                          setIntro(defaultDetail?.intro || '');
                          setEducation(defaultDetail?.education || '');
                          setExperience(defaultDetail?.experience || '');
                          setProjectDetail(getRoleSpecificProjectDetail(defaultDetail, currentUserRole));
                          setFieldErrors({});
                          setModalMessage(null);
                          setEditingDetailInRequestModal(false);
                        }}
                      >
                        取消修改
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-border/60 bg-background/50 p-2">
                    {requestDraftRows.map(([label, value]) => (
                      <div className="rounded-lg border border-border/60 bg-background/70 p-3" key={label}>
                        <strong className="text-sm text-foreground">{label}</strong>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {modalMessage ? <p className="text-sm text-destructive">{modalMessage}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button className={buttonVariants()} disabled={submittingRequest} type="button" onClick={() => void handleCreateRequest()}>
                    {submittingRequest ? '发送中…' : '发送并询问'}
                  </button>
                  <button className={buttonVariants({ variant: 'outline' })} disabled={submittingRequest} type="button" onClick={() => setRequestModalOpen(false)}>
                    取消申请
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">还没有录入详细信息，请先录入。这些信息不会被公开显示，只有此程序员能查看。</p>
                <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
                  <label className="grid gap-1 text-sm text-foreground">
                    个人简介
                    <Textarea
                      className={cn(fieldErrors.intro ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="intro"
                      onChange={(event) => {
                        setIntro(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, intro: getDetailFieldError('intro', event.target.value) }));
                      }}
                      rows={3}
                      placeholder="请避免泄漏个人隐私及联系方式。"
                      value={intro}
                    />
                    {fieldErrors.intro ? <span className="text-xs text-destructive">{fieldErrors.intro}</span> : null}
                  </label>
                  <label className="grid gap-1 text-sm text-foreground">
                    教育背景
                    <Textarea
                      className={cn(fieldErrors.education ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="education"
                      onChange={(event) => {
                        setEducation(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, education: getDetailFieldError('education', event.target.value) }));
                      }}
                      rows={2}
                      placeholder="请概要介绍下学校、专业等情况，或许能遇到校友。"
                      value={education}
                    />
                    {fieldErrors.education ? <span className="text-xs text-destructive">{fieldErrors.education}</span> : null}
                  </label>
                  <label className="grid gap-1 text-sm text-foreground">
                    工作背景
                    <Textarea
                      className={cn(fieldErrors.experience ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="experience"
                      onChange={(event) => {
                        setExperience(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, experience: getDetailFieldError('experience', event.target.value) }));
                      }}
                      rows={3}
                      placeholder="请概要介绍工作经历和职责，这对创业伙伴了解你非常重要。"
                      value={experience}
                    />
                    {fieldErrors.experience ? <span className="text-xs text-destructive">{fieldErrors.experience}</span> : null}
                  </label>
                  <label className="grid gap-1 text-sm text-foreground">
                    {projectFieldLabel}
                    <Textarea
                      className={cn(fieldErrors.projectDetail ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="projectDetail"
                      onChange={(event) => {
                        setProjectDetail(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, projectDetail: getDetailFieldError('projectDetail', event.target.value, projectFieldLabel) }));
                      }}
                      rows={4}
                      placeholder={projectFieldPlaceholder}
                      value={projectDetail}
                    />
                    {fieldErrors.projectDetail ? <span className="text-xs text-destructive">{fieldErrors.projectDetail}</span> : null}
                  </label>
                </form>
                {modalMessage ? <p className="text-sm text-destructive">{modalMessage}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button className={buttonVariants()} disabled={savingDetail || submittingRequest} type="button" onClick={() => void handleSaveDetailAndCreateRequest()}>
                    {savingDetail || submittingRequest ? '提交中…' : '保存详细信息并发送申请'}
                  </button>
                  <button className={buttonVariants({ variant: 'outline' })} disabled={savingDetail || submittingRequest} type="button" onClick={() => setRequestModalOpen(false)}>
                    取消申请
                  </button>
                </div>
              </div>
            )}
            </section>
          </div>
        </div>
      ) : null}

      {exchangeContactModalOpen && requestMeta ? (
        <div className="fixed inset-0 z-[65] overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="交换联系方式">
          <button className="fixed inset-0 bg-foreground/30" onClick={() => setExchangeContactModalOpen(false)} type="button" aria-label="关闭弹框" />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="relative w-full max-w-2xl space-y-4 rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
              <button
                aria-label="关闭交换联系方式弹框"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-background text-xl leading-none text-foreground shadow-[0_8px_18px_rgba(79,108,163,0.2)] transition-colors hover:bg-accent"
                type="button"
                onClick={() => setExchangeContactModalOpen(false)}
              >
                ×
              </button>
              <h2 className="text-xl font-semibold text-foreground">交换联系方式</h2>
              <p className="text-sm text-muted-foreground">对方已经提供以下信息：</p>
              <div className="grid max-h-52 gap-2 overflow-y-auto rounded-lg border border-border/60 bg-background/70 p-3">
                {publisherDetailRows.map(([label, value]) => (
                  <div className="rounded-md border border-border/50 bg-background/85 p-2" key={`exchange-${String(label)}`}>
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-muted-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {exchangeJustCompleted ? (
                <section className="space-y-3 rounded-xl border border-emerald-300/75 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-4">
                  <h3 className="text-base font-semibold text-emerald-900">交换成功，对方联系方式如下：</h3>
                  {justExchangedPublisherContacts.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {normalizeContactDisplayItems(justExchangedPublisherContacts, 'just-exchanged').map((contact) => {
                        const revealed = revealedContactValuesByKey[contact.id] || false;

                        return (
                          <div className="rounded-lg border border-emerald-300/65 bg-white/90 px-3 py-2" key={contact.id}>
                            <p className="text-xs font-medium text-emerald-900">{contact.label}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p className="break-words text-sm text-emerald-800">{revealed ? contact.value : maskContactValue(contact.value)}</p>
                              {revealed ? (
                                <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2 text-xs')} type="button" onClick={() => handleHideContactValue(contact.id)}>
                                  隐藏
                                </button>
                              ) : (
                                <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2 text-xs')} type="button" onClick={() => handleOpenContactDisclosure(contact.id)}>
                                  查看
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-md border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">对方尚未填写联系方式，暂时无法查看。</p>
                  )}
                  <button className={buttonVariants()} type="button" onClick={() => setExchangeContactModalOpen(false)}>
                    我已看到联系方式
                  </button>
                </section>
              ) : (
                <>
                  <section className="space-y-3 rounded-xl border border-emerald-300/60 bg-emerald-50/80 p-3">
                    <h3 className="text-sm font-semibold text-emerald-900">对方已提供联系方式</h3>
                    <p className="text-xs leading-5 text-emerald-800">
                      如果你希望与对方联系，请填你的联系方式并保存。
                      <br />
                      保存后，双方可立即看到彼此联系方式。
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="grid gap-1 text-xs text-foreground sm:col-span-2">
                        称呼
                        <input
                          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                          name="exchangeContactDisplayName"
                          placeholder="选填，例如 王女士 / Alex"
                          value={contactDisplayName}
                          onChange={(event) => setContactDisplayName(event.target.value)}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-foreground">
                        手机号
                        <input className="h-9 rounded-md border border-border bg-background px-3 text-sm" placeholder="选填" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
                      </label>
                      <label className="grid gap-1 text-xs text-foreground">
                        微信
                        <input className="h-9 rounded-md border border-border bg-background px-3 text-sm" placeholder="选填" value={contactWechat} onChange={(event) => setContactWechat(event.target.value)} />
                      </label>
                      <label className="grid gap-1 text-xs text-foreground">
                        邮箱
                        <input className="h-9 rounded-md border border-border bg-background px-3 text-sm" placeholder="选填" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
                      </label>
                      <label className="grid gap-1 text-xs text-foreground">
                        QQ
                        <input className="h-9 rounded-md border border-border bg-background px-3 text-sm" placeholder="选填" value={contactQq} onChange={(event) => setContactQq(event.target.value)} />
                      </label>
                    </div>
                    <label className="grid gap-1 text-xs text-foreground">
                      其他联系方式
                      <input className="h-9 rounded-md border border-border bg-background px-3 text-sm" placeholder="选填，例如 Telegram / 飞书 / Discord" value={contactOther} onChange={(event) => setContactOther(event.target.value)} />
                    </label>
                    {contactValidationMessage ? <p className="rounded-md border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">{contactValidationMessage}</p> : null}
                    <button className={buttonVariants()} disabled={savingExchangeContact} type="button" onClick={() => void handleConfirmExchangeContact()}>
                      {savingExchangeContact ? '提交中…' : '保存并交换联系方式'}
                    </button>
                  </section>

                  <section className="space-y-3 rounded-xl border border-amber-300/65 bg-amber-50/85 p-3">
                    <h3 className="text-sm font-semibold text-amber-900">不想联系</h3>
                    <p className="text-xs leading-5 text-amber-800">
                      如果你当前不想联系，建议填写说明后提交。
                      <br />
                      这样双方都不会看到彼此联系方式，可避免联系信息泄漏。
                    </p>
                    <label className="grid gap-1 text-sm text-foreground">
                      说明
                      <Textarea name="exchangeRejectReason" rows={4} value={exchangeRejectReason} onChange={(event) => setExchangeRejectReason(event.target.value)} />
                    </label>
                    <button className={buttonVariants({ variant: 'outline' })} disabled={savingExchangeContact} type="button" onClick={() => void handleDeclineExchangeContact()}>
                      不想联系
                    </button>
                  </section>
                </>
              )}

              {exchangeModalMessage ? (
                <p className={cn('text-sm', exchangeJustCompleted ? 'text-emerald-700' : 'text-destructive')}>{exchangeModalMessage}</p>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}

      {riskNoticeModalOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="风险提示">
          <button className="fixed inset-0 bg-foreground/35" onClick={() => setRiskNoticeModalOpen(false)} type="button" aria-label="关闭风险提示弹框" />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="relative max-h-[calc(100vh-2rem)] supports-[height:100dvh]:max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-amber-300/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,247,237,0.98))] p-5 shadow-[0_18px_42px_rgba(180,83,9,0.2)] backdrop-blur-md">
              <button
                aria-label="关闭风险提示弹框"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/70 bg-white text-xl leading-none text-amber-900 shadow-[0_8px_18px_rgba(180,83,9,0.2)] transition-colors hover:bg-amber-100"
                type="button"
                onClick={() => setRiskNoticeModalOpen(false)}
              >
                ×
              </button>
              <h2 className="pr-10 text-xl font-semibold text-amber-950">风险提示（请务必阅读）</h2>

              <section className="space-y-2 rounded-xl border border-amber-300/70 bg-white/80 p-4">
                <h3 className="text-sm font-semibold text-amber-900">善意提醒</h3>
                <p className="text-sm leading-6 text-amber-900/95">
                  本平台是公益性质的信息连接服务，平台不会也无法对项目发布者身份、项目真实性、项目履约能力作出实质性背书。
                  在当前诈骗与虚假信息高发环境下，请你务必保持审慎，优先通过小范围、可验证的协作来建立信任。
                </p>
              </section>

              <section className="space-y-2 rounded-xl border border-amber-300/70 bg-white/80 p-4">
                <h3 className="text-sm font-semibold text-amber-900">建议你这样做</h3>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-amber-900/95">
                  <li>在完成 MVP 前，尽量不要发生任何金钱往来、借贷或股权承诺。</li>
                  <li>把“共同完成 MVP”作为主要验证过程，通过真实协作判断对方能力、执行力与诚信度。</li>
                  <li>对关键身份和经历信息做交叉验证，例如学信网、工作邮箱、公开职业档案、可核验的项目记录等。</li>
                </ul>
              </section>

              <section className="space-y-2 rounded-xl border border-rose-300/70 bg-rose-50/80 p-4">
                <h3 className="text-sm font-semibold text-rose-900">免责与责任边界</h3>
                <p className="text-sm leading-6 text-rose-900/95">
                  平台仅提供信息展示与沟通工具，不参与任何线下接触、交易决策、合同签署、资金流转、股权安排或争议处理。
                  用户之间因沟通、合作或交易引发的任何直接或间接损失、纠纷与法律后果，概由相关用户自行承担全部法律责任，平台免除一切担保、连带及赔偿责任。
                </p>
                <p className="text-sm font-semibold leading-6 text-rose-900/95">
                  特别提示：你通过本站获取的联系方式与对方联系，将被视为你已充分阅读、理解并自愿接受上述条款约束。
                </p>
              </section>

              <div className="flex justify-end">
                <button className={buttonVariants()} type="button" onClick={() => setRiskNoticeModalOpen(false)}>
                  我已阅读并理解
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {mvpGuideModalOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="MVP建议">
          <button className="fixed inset-0 bg-foreground/35" onClick={() => setMvpGuideModalOpen(false)} type="button" aria-label="关闭MVP建议弹框" />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="relative max-h-[calc(100vh-2rem)] supports-[height:100dvh]:max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-sky-300/70 bg-[linear-gradient(180deg,rgba(239,246,255,0.98),rgba(236,253,245,0.98))] p-5 shadow-[0_18px_42px_rgba(14,116,144,0.18)] backdrop-blur-md">
              <button
                aria-label="关闭MVP建议弹框"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/70 bg-white text-xl leading-none text-sky-900 shadow-[0_8px_18px_rgba(14,116,144,0.2)] transition-colors hover:bg-sky-100"
                type="button"
                onClick={() => setMvpGuideModalOpen(false)}
              >
                ×
              </button>
              <h2 className="pr-10 text-xl font-semibold text-sky-950">MVP 建议（先验证，再投入）</h2>

              <section className="space-y-2 rounded-xl border border-sky-300/70 bg-white/85 p-4">
                <h3 className="text-sm font-semibold text-sky-900">为什么先做 MVP</h3>
                <p className="text-sm leading-6 text-sky-900/95">
                  MVP 的核心目标是：用最小投入，尽快验证需求是否真实成立。
                  当你们看到真实用户反馈、留存或付费意愿后，再决定是否继续深度合作，会更稳、更高效。
                  同时，MVP 共创过程本身，也能帮助双方更快判断彼此的沟通效率、执行能力与合作默契。
                </p>
              </section>

              <section className="space-y-2 rounded-xl border border-sky-300/70 bg-white/85 p-4">
                <h3 className="text-sm font-semibold text-sky-900">可落地的两种起步方式</h3>
                <div className="grid gap-2">
                  <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3">
                    <p className="text-sm font-semibold text-sky-900">方案 A：先销售，再做产品（Waitlist 验证）</p>
                    <p className="mt-1 text-sm leading-6 text-sky-900/90">
                      先做一个清晰的 waitlist 页面，讲清价值主张与目标人群，收集邮箱或预约意向，暂不开发完整功能。
                      先验证“有没有人愿意为这个问题停留和报名”。
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                    <p className="text-sm font-semibold text-emerald-900">方案 B：只做核心能力最小闭环</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-900/90">
                      先实现核心功能的基础版，账户体系、复杂 UI、支付等可暂缓。
                      优先拉目标用户试用，重点观察“是否解决痛点”与“是否有付费意愿”。
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-300/70 bg-slate-50/80 p-4">
                <p className="text-sm leading-6 text-slate-700">
                  建议你们把每周目标控制在 1-2 个可验证指标（如报名数、访谈数、试用留存、付费意向），
                  用数据决定下一步，而不是用想象决定投入。
                </p>
              </section>

              <div className="flex justify-end">
                <button className={buttonVariants()} type="button" onClick={() => setMvpGuideModalOpen(false)}>
                  我知道了，继续沟通
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {contactDisclosureModalOpen ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="联系方式查看条款">
          <button className="fixed inset-0 bg-foreground/35" onClick={handleCloseContactDisclosure} type="button" aria-label="关闭条款弹框" />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="relative w-full max-w-xl space-y-4 rounded-2xl border border-rose-300/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.99),rgba(255,241,242,0.99))] p-5 shadow-[0_18px_42px_rgba(190,24,93,0.22)] backdrop-blur-md">
              <button
                aria-label="关闭联系方式查看条款弹框"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/70 bg-white text-xl leading-none text-rose-900 shadow-[0_8px_18px_rgba(190,24,93,0.2)] transition-colors hover:bg-rose-100"
                type="button"
                onClick={handleCloseContactDisclosure}
              >
                ×
              </button>
              <h2 className="pr-10 text-xl font-semibold text-rose-950">查看联系方式前请确认</h2>

              <section className="space-y-2 rounded-xl border border-rose-300/70 bg-white/90 p-4">
                <h3 className="text-sm font-semibold text-rose-900">信息真实性声明</h3>
                <p className="text-sm leading-6 text-rose-900/95">平台上的身份、履历、项目与联系方式均由用户自行填写，平台不做人工核验，也不提供真实性担保。</p>
              </section>

              <section className="space-y-2 rounded-xl border border-rose-300/70 bg-white/90 p-4">
                <h3 className="text-sm font-semibold text-rose-900">责任与风险约定</h3>
                <p className="text-sm leading-6 text-rose-900/95">
                  你需自行判断并承担由联系、线下会面、交易、转账、签约等行为产生的一切风险与法律后果；如发生争议或损失，由相关用户自行处理，平台不承担担保、连带或赔偿责任。
                </p>
              </section>

              <section className="space-y-2 rounded-xl border border-rose-300/70 bg-white/90 p-4">
                <h3 className="text-sm font-semibold text-rose-900">确认条款</h3>
                <p className="text-sm leading-6 text-rose-900/95">你点击“接受条款并查看联系方式”，即视为已充分阅读、理解并同意接受上述全部条款约束。</p>
              </section>

              <div className="flex flex-wrap justify-end gap-2">
                <button className={buttonVariants({ variant: 'outline' })} type="button" onClick={handleCloseContactDisclosure}>
                  放弃查看
                </button>
                <button className={buttonVariants()} type="button" onClick={handleAcceptContactDisclosure}>
                  接受条款并查看联系方式
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {requesterDetailModalOpen && activeIncomingRequest ? (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="申请者详细信息">
          <button className="fixed inset-0 bg-foreground/30" onClick={() => setRequesterDetailModalOpen(false)} type="button" aria-label="关闭弹框" />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="relative w-full max-w-2xl space-y-4 rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
              <button
                aria-label="关闭申请者详情弹框"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-background text-xl leading-none text-foreground shadow-[0_8px_18px_rgba(79,108,163,0.2)] transition-colors hover:bg-accent"
                type="button"
                onClick={() => setRequesterDetailModalOpen(false)}
              >
                ×
              </button>
              <h2 className="text-xl font-semibold text-foreground">申请者详情</h2>
              <p className="text-sm text-muted-foreground">
                申请者：{activeIncomingRequest.requester.displayName || '未知用户'}
                <br />
                申请时间：{formatDateTime(activeIncomingRequest.createdAt)}
              </p>
              <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-border/60 bg-background/60 p-2">
                {buildDetailRows(
                  activeIncomingRequest.requester.detailedProfile,
                  activeIncomingRequest.targetCard.role === 'expert' ? 'developer' : 'expert',
                  '暂未开放',
                ).map(([label, value]) => (
                  <div className="rounded-lg border border-border/60 bg-background/70 p-3" key={`incoming-${String(label)}`}>
                    <strong className="text-sm text-foreground">{label}</strong>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{value}</p>
                  </div>
                ))}
              </div>
              {activeIncomingRequest.actions.canApprove || activeIncomingRequest.actions.canReject ? (
                <div className="flex flex-wrap gap-2">
                  {activeIncomingRequest.actions.canApprove ? (
                    <button
                      className={buttonVariants()}
                      disabled={pendingIncomingActionRequestId === activeIncomingRequest.id}
                      type="button"
                      onClick={() => {
                        void handleStartApproveFlow(activeIncomingRequest);
                      }}
                    >
                      和Ta聊聊
                    </button>
                  ) : null}
                  {activeIncomingRequest.actions.canReject ? (
                    <button
                      className={buttonVariants({ variant: 'destructive' })}
                      disabled={pendingIncomingActionRequestId === activeIncomingRequest.id}
                      type="button"
                      onClick={() => {
                        setRejectReason(defaultRejectReason);
                        setIncomingModalMessage(null);
                        setRejectRequestModalOpen(true);
                      }}
                    >
                      不感兴趣
                    </button>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}

      {approveRequestModalOpen && activeIncomingRequest ? (
        <div className="fixed inset-0 z-[60] overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="和Ta聊聊">
          <button
            className="fixed inset-0 bg-foreground/30"
            onClick={() => {
              setIncomingModalMessage(null);
              setEditingDetailInApproveModal(false);
              setApproveRequestModalOpen(false);
            }}
            type="button"
            aria-label="关闭弹框"
          />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="max-h-[calc(100vh-2rem)] supports-[height:100dvh]:max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
              <h2 className="text-xl font-semibold text-foreground">和Ta聊聊</h2>
              <div className="request-modal-alert">
                <p className="request-modal-alert-text">
                  小提醒：联系对方前，建议先把你的详细信息发给对方。
                  <br />
                  你写得越具体，对方越容易判断匹配度，也更愿意继续推进。
                  <br />这些信息不会公开显示，只有对方才能查看。
                </p>
                <details className="request-modal-help">
                  <summary aria-label="为什么建议先认真填写这些内容">?</summary>
                  <div className="request-modal-help-popover">
                    <p>你认真写清楚项目阶段和个人背景，对方更容易判断是否匹配，也更愿意给出真诚回复。</p>
                    <p>你的每一句具体描述，都会让对方感觉到被尊重，这比“模板化申请”更容易打动人。</p>
                  </div>
                </details>
              </div>

              {hasDetailProfile ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">以下信息将会发给对方：</p>
                    {!editingDetailInApproveModal ? (
                      <button
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 px-3 text-xs')}
                        disabled={savingDetail || pendingIncomingActionRequestId === activeIncomingRequest.id}
                        type="button"
                        onClick={() => {
                          setIncomingModalMessage(null);
                          setFieldErrors({});
                          setEditingDetailInApproveModal(true);
                        }}
                      >
                        修改
                      </button>
                    ) : null}
                  </div>

                  {editingDetailInApproveModal ? (
                    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
                      <label className="grid gap-1 text-sm text-foreground">
                        个人简介
                        <Textarea
                          className={cn(fieldErrors.intro ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                          name="intro"
                          onChange={(event) => {
                            setIntro(event.target.value);
                            setFieldErrors((previous) => ({ ...previous, intro: getDetailFieldError('intro', event.target.value) }));
                          }}
                          rows={3}
                          placeholder="请避免泄漏个人隐私及联系方式。"
                          value={intro}
                        />
                        {fieldErrors.intro ? <span className="text-xs text-destructive">{fieldErrors.intro}</span> : null}
                      </label>
                      <label className="grid gap-1 text-sm text-foreground">
                        教育背景
                        <Textarea
                          className={cn(fieldErrors.education ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                          name="education"
                          onChange={(event) => {
                            setEducation(event.target.value);
                            setFieldErrors((previous) => ({ ...previous, education: getDetailFieldError('education', event.target.value) }));
                          }}
                          rows={2}
                          placeholder="请概要介绍下学校、专业等情况，或许能遇到校友。"
                          value={education}
                        />
                        {fieldErrors.education ? <span className="text-xs text-destructive">{fieldErrors.education}</span> : null}
                      </label>
                      <label className="grid gap-1 text-sm text-foreground">
                        工作背景
                        <Textarea
                          className={cn(fieldErrors.experience ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                          name="experience"
                          onChange={(event) => {
                            setExperience(event.target.value);
                            setFieldErrors((previous) => ({ ...previous, experience: getDetailFieldError('experience', event.target.value) }));
                          }}
                          rows={3}
                          placeholder="请概要介绍工作经历和职责，这对创业伙伴了解你非常重要。"
                          value={experience}
                        />
                        {fieldErrors.experience ? <span className="text-xs text-destructive">{fieldErrors.experience}</span> : null}
                      </label>
                      <label className="grid gap-1 text-sm text-foreground">
                        {projectFieldLabel}
                        <Textarea
                          className={cn(fieldErrors.projectDetail ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                          name="projectDetail"
                          onChange={(event) => {
                            setProjectDetail(event.target.value);
                            setFieldErrors((previous) => ({ ...previous, projectDetail: getDetailFieldError('projectDetail', event.target.value, projectFieldLabel) }));
                          }}
                          rows={4}
                          placeholder={projectFieldPlaceholder}
                          value={projectDetail}
                        />
                        {fieldErrors.projectDetail ? <span className="text-xs text-destructive">{fieldErrors.projectDetail}</span> : null}
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          className={buttonVariants({ size: 'sm' })}
                          disabled={savingDetail || pendingIncomingActionRequestId === activeIncomingRequest.id}
                          type="button"
                          onClick={() => void handleSaveDetailOnlyForApproveModal()}
                        >
                          {savingDetail ? '保存中…' : '保存修改'}
                        </button>
                        <button
                          className={buttonVariants({ variant: 'outline', size: 'sm' })}
                          disabled={savingDetail || pendingIncomingActionRequestId === activeIncomingRequest.id}
                          type="button"
                          onClick={() => {
                            setIntro(profile?.user.detailedProfile?.intro || '');
                            setEducation(profile?.user.detailedProfile?.education || '');
                            setExperience(profile?.user.detailedProfile?.experience || '');
                            setProjectDetail(getRoleSpecificProjectDetail(profile?.user.detailedProfile, currentUserRole));
                            setFieldErrors({});
                            setIncomingModalMessage(null);
                            setEditingDetailInApproveModal(false);
                          }}
                        >
                          取消修改
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-border/60 bg-background/50 p-2">
                      {profilePreviewRows.map(([label, value]) => (
                        <div className="rounded-lg border border-border/60 bg-background/70 p-3" key={`approve-${label}`}>
                          <strong className="text-sm text-foreground">{label}</strong>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
                  <label className="grid gap-1 text-sm text-foreground">
                    个人简介
                    <Textarea
                      className={cn(fieldErrors.intro ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="intro"
                      onChange={(event) => {
                        setIntro(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, intro: getDetailFieldError('intro', event.target.value) }));
                      }}
                      rows={3}
                      placeholder="请避免泄漏个人隐私及联系方式。"
                      value={intro}
                    />
                    {fieldErrors.intro ? <span className="text-xs text-destructive">{fieldErrors.intro}</span> : null}
                  </label>
                  <label className="grid gap-1 text-sm text-foreground">
                    教育背景
                    <Textarea
                      className={cn(fieldErrors.education ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="education"
                      onChange={(event) => {
                        setEducation(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, education: getDetailFieldError('education', event.target.value) }));
                      }}
                      rows={2}
                      placeholder="请概要介绍下学校、专业等情况，或许能遇到校友。"
                      value={education}
                    />
                    {fieldErrors.education ? <span className="text-xs text-destructive">{fieldErrors.education}</span> : null}
                  </label>
                  <label className="grid gap-1 text-sm text-foreground">
                    工作背景
                    <Textarea
                      className={cn(fieldErrors.experience ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="experience"
                      onChange={(event) => {
                        setExperience(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, experience: getDetailFieldError('experience', event.target.value) }));
                      }}
                      rows={3}
                      placeholder="请概要介绍工作经历和职责，这对创业伙伴了解你非常重要。"
                      value={experience}
                    />
                    {fieldErrors.experience ? <span className="text-xs text-destructive">{fieldErrors.experience}</span> : null}
                  </label>
                  <label className="grid gap-1 text-sm text-foreground">
                    {projectFieldLabel}
                    <Textarea
                      className={cn(fieldErrors.projectDetail ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="projectDetail"
                      onChange={(event) => {
                        setProjectDetail(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, projectDetail: getDetailFieldError('projectDetail', event.target.value, projectFieldLabel) }));
                      }}
                      rows={4}
                      placeholder={projectFieldPlaceholder}
                      value={projectDetail}
                    />
                    {fieldErrors.projectDetail ? <span className="text-xs text-destructive">{fieldErrors.projectDetail}</span> : null}
                  </label>
                </form>
              )}

              <section className="space-y-3 rounded-xl border border-emerald-300/60 bg-emerald-50/80 p-3">
                <h3 className="text-sm font-semibold text-emerald-900">联系方式</h3>
                <p className="text-xs leading-5 text-emerald-800">
                  请填写你的联系方式。
                  <strong>只有当对方也提供联系方式给你之后，他才能看到你的联系方式。</strong>
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-foreground sm:col-span-2">
                    称呼
                    <input
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      name="contactDisplayName"
                      placeholder="选填，例如 王女士 / Alex"
                      value={contactDisplayName}
                      onChange={(event) => {
                        setContactDisplayName(event.target.value);
                      }}
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-foreground">
                    手机号
                    <input
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      name="contactPhone"
                      placeholder="选填"
                      value={contactPhone}
                      onChange={(event) => {
                        setContactPhone(event.target.value);
                        setContactValidationMessage(null);
                      }}
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-foreground">
                    微信
                    <input
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      name="contactWechat"
                      placeholder="选填"
                      value={contactWechat}
                      onChange={(event) => {
                        setContactWechat(event.target.value);
                        setContactValidationMessage(null);
                      }}
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-foreground">
                    邮箱
                    <input
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      name="contactEmail"
                      placeholder="选填"
                      value={contactEmail}
                      onChange={(event) => {
                        setContactEmail(event.target.value);
                        setContactValidationMessage(null);
                      }}
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-foreground">
                    QQ
                    <input
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      name="contactQq"
                      placeholder="选填"
                      value={contactQq}
                      onChange={(event) => {
                        setContactQq(event.target.value);
                        setContactValidationMessage(null);
                      }}
                    />
                  </label>
                </div>
                <label className="grid gap-1 text-xs text-foreground">
                  其他联系方式
                  <input
                    className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                    name="contactOther"
                    placeholder="选填，例如 Telegram / 飞书 / Discord"
                    value={contactOther}
                    onChange={(event) => {
                      setContactOther(event.target.value);
                      setContactValidationMessage(null);
                    }}
                  />
                </label>
                {contactValidationMessage ? (
                  <p className="rounded-md border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive sm:text-sm">
                    {contactValidationMessage}
                  </p>
                ) : null}
              </section>

              {incomingModalMessage ? <p className="text-sm text-destructive">{incomingModalMessage}</p> : null}

              <div className="flex flex-wrap gap-2">
                <button
                  className={buttonVariants()}
                  disabled={pendingIncomingActionRequestId === activeIncomingRequest.id}
                  type="button"
                  onClick={() => void handleApproveIncomingRequest()}
                >
                  {pendingIncomingActionRequestId === activeIncomingRequest.id ? '提交中…' : '发送并申请聊聊'}
                </button>
                <button
                  className={buttonVariants({ variant: 'outline' })}
                  disabled={pendingIncomingActionRequestId === activeIncomingRequest.id}
                  type="button"
                  onClick={() => {
                    setIncomingModalMessage(null);
                    setEditingDetailInApproveModal(false);
                    setApproveRequestModalOpen(false);
                  }}
                >
                  取消
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {rejectRequestModalOpen && activeIncomingRequest ? (
        <div className="fixed inset-0 z-[60] overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="拒绝申请">
          <button className="fixed inset-0 bg-foreground/30" onClick={() => setRejectRequestModalOpen(false)} type="button" aria-label="关闭弹框" />
          <div className="relative z-10 flex min-h-full items-start justify-center py-2 md:items-center">
            <section className="w-full max-w-xl space-y-4 rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
              <h2 className="text-xl font-semibold text-foreground">不感兴趣</h2>
              <p className="text-sm text-muted-foreground">不合适也建议给对方一个反馈，对方已经花时间认真填写了详细信息，早点说清楚，彼此都更轻松。</p>
              <label className="grid gap-1 text-sm text-foreground">
                反馈理由
                <Textarea name="rejectReason" onChange={(event) => setRejectReason(event.target.value)} rows={5} value={rejectReason} />
              </label>
              {incomingModalMessage ? <p className="text-sm text-destructive">{incomingModalMessage}</p> : null}
              <div className="flex flex-wrap gap-2">
                <button
                  className={buttonVariants({ variant: 'destructive' })}
                  disabled={pendingIncomingActionRequestId === activeIncomingRequest.id}
                  type="button"
                  onClick={() => void handleRejectIncomingRequest()}
                >
                  {pendingIncomingActionRequestId === activeIncomingRequest.id ? '提交中…' : '确认发送反馈'}
                </button>
                <button
                  className={buttonVariants({ variant: 'outline' })}
                  disabled={pendingIncomingActionRequestId === activeIncomingRequest.id}
                  type="button"
                  onClick={() => setRejectRequestModalOpen(false)}
                >
                  取消
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      
    </div>
  );
}
