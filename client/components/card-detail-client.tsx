'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CardEngagementActions } from '@/components/card-engagement-actions';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatBeijingDateTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import {
  approveDetailRequest,
  createDetailRequest,
  declineContact,
  exchangeContact,
  extractErrorMessage,
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
import { fallbackPublicCards, roleLabels } from '@/lib/site-data';
import { useAuthState } from '@/lib/use-auth';

type CardDetailClientProps = {
  id: string;
};

type DetailField = 'intro' | 'education' | 'experience' | 'projectDetail';

const detailFieldMeta: Record<DetailField, { label: string; minLength: number }> = {
  intro: { label: '个人简介', minLength: 6 },
  education: { label: '教育背景', minLength: 4 },
  experience: { label: '工作背景', minLength: 6 },
  projectDetail: { label: '项目详情', minLength: 6 },
};

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

function getDetailFieldError(field: DetailField, value: string) {
  const trimmed = value.trim();
  const { label, minLength } = detailFieldMeta[field];

  if (!trimmed) {
    return `请填写${label}`;
  }

  if (trimmed.length < minLength) {
    return `${label}至少需要 ${minLength} 个字符`;
  }

  return '';
}

function validateDetailFields(values: Record<DetailField, string>) {
  return (Object.keys(values) as DetailField[]).reduce<Partial<Record<DetailField, string>>>((acc, field) => {
    const nextError = getDetailFieldError(field, values[field]);

    if (nextError) {
      acc[field] = nextError;
    }

    return acc;
  }, {});
}

function parseDetailFieldErrorsFromMessage(message: string) {
  const text = message.toLowerCase();
  const nextErrors: Partial<Record<DetailField, string>> = {};

  const matchers: Array<[DetailField, RegExp[]]> = [
    ['intro', [/intro/, /个人简介/]],
    ['education', [/education/, /教育背景/]],
    ['experience', [/experience/, /工作背景/]],
    ['projectDetail', [/projectdetail/, /project detail/, /项目详情/, /项目介绍/]],
  ];

  matchers.forEach(([field, patterns]) => {
    if (patterns.some((pattern) => pattern.test(text))) {
      nextErrors[field] = detailFieldMeta[field].label + `至少需要 ${detailFieldMeta[field].minLength} 个字符`;
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
  const [processedActionAtByRequestId, setProcessedActionAtByRequestId] = useState<Record<string, string>>({});
  const [expandedCommunicationInfoById, setExpandedCommunicationInfoById] = useState<Record<string, boolean>>({});
  const [collapsedIncomingCommunicationByRequestId, setCollapsedIncomingCommunicationByRequestId] = useState<Record<string, boolean>>({});

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
    setProjectDetail(profile.user.detailedProfile?.projectDetail || '');
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

    await createDetailRequest(card.id);
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
    });

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
      await saveDetailProfile({ intro, education, experience, projectDetail });
      await refresh();
      setEditingDetailInApproveModal(false);
      setMessage('详细信息已更新，可继续发送申请。');
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      const backendFieldErrors = parseDetailFieldErrorsFromMessage(errorMessage);

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
    });

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
      await saveDetailProfile({ intro, education, experience, projectDetail });
      await refresh();
      setEditingDetailInRequestModal(false);
      setMessage('详细信息已更新，可继续发送申请。');
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      const backendFieldErrors = parseDetailFieldErrorsFromMessage(errorMessage);

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
    });

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
      await saveDetailProfile({ intro, education, experience, projectDetail });
      await refresh();
      await createRequestAndRefreshCard();
      setRequestModalOpen(false);
      setMessage('详细信息已提交并成功发起申请，接下来等待对方处理。');
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      const backendFieldErrors = parseDetailFieldErrorsFromMessage(errorMessage);

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
    });

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setIncomingModalMessage('请先完善你的详细信息后再继续。');
      return false;
    }

    await saveDetailProfile({ intro, education, experience, projectDetail });
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
      await exchangeContact(requestMeta.id);
      await refreshRequestsForCurrentCard();
      const nextCard = await fetchCardById(id);

      if (nextCard) {
        setCard(nextCard);
      }

      setExchangeContactModalOpen(false);
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
      const backendFieldErrors = parseDetailFieldErrorsFromMessage(errorMessage);

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
  const hasDetailProfile = Boolean(profile?.completion.hasDetailProfile && profile.user.detailedProfile);
  const previewRows = [
    ['项目详情', profile?.user.detailedProfile?.projectDetail || '未填写'],
    ['个人简介', profile?.user.detailedProfile?.intro || '未填写'],
    ['教育背景', profile?.user.detailedProfile?.education || '未填写'],
    ['工作背景', profile?.user.detailedProfile?.experience || '未填写'],
  ] as const;
  const alertText = hasDetailProfile
    ? '小提醒：先把下面这些信息发给对方，对方会更放心，也更愿意继续聊下去。'
    : '小提醒：先花几分钟把下面的信息补充一下发给对方，对方会更放心，也更愿意继续聊下去。';
  const alertSubText = '这些信息只会在你点击“提交申请”后发送给对方。';
  const noVisibleContactsHint = requestMeta?.status === 'contact_exchanged'
    ? '对方尚未填写联系方式，暂时无法查看。'
    : '你填写得越清楚，对方越容易判断你们是否合适，也就更可能把更多信息开放给你。';
  const isOwnCard = Boolean(authenticated && profile?.user.id && card.ownerId && profile.user.id === card.ownerId);
  const incomingRequestsSorted = [...incomingRequestsForCard].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const publisherDetailRows: ReadonlyArray<readonly [string, string]> = [
    ['项目详情', requestMeta?.publisher.detailedProfile?.projectDetail || '暂未开放'],
    ['个人简介', requestMeta?.publisher.detailedProfile?.intro || '暂未开放'],
    ['教育背景', requestMeta?.publisher.detailedProfile?.education || '暂未开放'],
    ['工作背景', requestMeta?.publisher.detailedProfile?.experience || '暂未开放'],
  ];
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
        text: '你已完成交换联系方式，双方可以立即查看彼此联系方式。',
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
        <p className="text-xs text-muted-foreground">编号：{card.id}</p>
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
              <CardEngagementActions cardId={id} />
            </div>
            {!authenticated ? (
              <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'ml-auto')} href={`/login?next=/cards/${id}`}>
                询问更多信息
              </Link>
            ) : card.viewerState ? (
              <div className="ml-auto flex items-center gap-2">
                <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', getViewerStatusBadgeClass(card.viewerState.status))}>当前状态：{statusLabel}</span>
                {requestMeta?.actions.canExchangeContact ? (
                  <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))} type="button" onClick={() => void handleOpenExchangeContactModal()}>
                    交换联系方式
                  </button>
                ) : null}
              </div>
            ) : isOwnCard ? null : (
              <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'ml-auto')} disabled={submittingRequest || savingDetail} type="button" onClick={openRequestModal}>
                {submittingRequest ? '发送中…' : '询问更多信息'}
              </button>
            )}
          </div>
        </div>
      </section>

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
                const communicationCollapsed = collapsedIncomingCommunicationByRequestId[request.id] || false;
                const requesterDetailRows: ReadonlyArray<readonly [string, string]> = [
                  ['项目详情', request.requester.detailedProfile?.projectDetail || '暂未查看'],
                  ['个人简介', request.requester.detailedProfile?.intro || '暂未查看'],
                  ['教育背景', request.requester.detailedProfile?.education || '暂未查看'],
                  ['工作背景', request.requester.detailedProfile?.experience || '暂未查看'],
                ];
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
                      detailRows: previewRows,
                    });
                  }

                  if (request.contactExchangedAt) {
                    logs.push({
                      id: `incoming-contact-${request.id}`,
                      at: request.contactExchangedAt,
                      tone: 'success',
                      text: '你已完成交换联系方式，双方可以立即查看彼此联系方式。',
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
                                      onClick={() => setExpandedCommunicationInfoById((previous) => ({ ...previous, [log.id]: !expanded }))}
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
              const detailRowsToShow = log.id === 'outgoing-created' ? previewRows : publisherDetailRows;

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
            <section className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
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
                      项目详情
                      <Textarea
                        className={cn(fieldErrors.projectDetail ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                        name="projectDetail"
                        onChange={(event) => {
                          setProjectDetail(event.target.value);
                          setFieldErrors((previous) => ({ ...previous, projectDetail: getDetailFieldError('projectDetail', event.target.value) }));
                        }}
                        rows={4}
                        placeholder="补充项目细节、成果或能力证明"
                        value={projectDetail}
                      />
                      {fieldErrors.projectDetail ? <span className="text-xs text-destructive">{fieldErrors.projectDetail}</span> : null}
                    </label>
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
                        placeholder="介绍你的背景和协作方式"
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
                        placeholder="学校、专业"
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
                        placeholder="做过哪些业务和职责"
                        value={experience}
                      />
                      {fieldErrors.experience ? <span className="text-xs text-destructive">{fieldErrors.experience}</span> : null}
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
                          setIntro(profile?.user.detailedProfile?.intro || '');
                          setEducation(profile?.user.detailedProfile?.education || '');
                          setExperience(profile?.user.detailedProfile?.experience || '');
                          setProjectDetail(profile?.user.detailedProfile?.projectDetail || '');
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
                    {previewRows.map(([label, value]) => (
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
                <p className="text-sm text-muted-foreground">还没有录入详细信息，请先录入详细信息。</p>
                <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
                  <label className="grid gap-1 text-sm text-foreground">
                    项目详情
                    <Textarea
                      className={cn(fieldErrors.projectDetail ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="projectDetail"
                      onChange={(event) => {
                        setProjectDetail(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, projectDetail: getDetailFieldError('projectDetail', event.target.value) }));
                      }}
                      rows={4}
                      placeholder="补充项目细节、成果或能力证明"
                      value={projectDetail}
                    />
                    {fieldErrors.projectDetail ? <span className="text-xs text-destructive">{fieldErrors.projectDetail}</span> : null}
                  </label>
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
                      placeholder="介绍你的背景和协作方式"
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
                      placeholder="学校、专业"
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
                      placeholder="做过哪些业务和职责"
                      value={experience}
                    />
                    {fieldErrors.experience ? <span className="text-xs text-destructive">{fieldErrors.experience}</span> : null}
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

              {exchangeModalMessage ? <p className="text-sm text-destructive">{exchangeModalMessage}</p> : null}
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
                {[
                  ['个人简介', activeIncomingRequest.requester.detailedProfile?.intro || '暂未开放'],
                  ['教育背景', activeIncomingRequest.requester.detailedProfile?.education || '暂未开放'],
                  ['工作背景', activeIncomingRequest.requester.detailedProfile?.experience || '暂未开放'],
                  ['项目详情', activeIncomingRequest.requester.detailedProfile?.projectDetail || '暂未开放'],
                ].map(([label, value]) => (
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
            <section className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-border/70 bg-card/96 p-5 shadow-[0_18px_42px_rgba(79,108,163,0.24)] backdrop-blur-md">
              <h2 className="text-xl font-semibold text-foreground">和Ta聊聊</h2>
              <div className="request-modal-alert">
                <p className="request-modal-alert-text">
                  小提醒：联系对方前，建议先把你的详细信息发给对方。
                  <br />
                  你写得越具体，对方越容易判断匹配度，也更愿意继续推进。
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
                        项目详情
                        <Textarea
                          className={cn(fieldErrors.projectDetail ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                          name="projectDetail"
                          onChange={(event) => {
                            setProjectDetail(event.target.value);
                            setFieldErrors((previous) => ({ ...previous, projectDetail: getDetailFieldError('projectDetail', event.target.value) }));
                          }}
                          rows={4}
                          placeholder="补充项目细节、成果或能力证明"
                          value={projectDetail}
                        />
                        {fieldErrors.projectDetail ? <span className="text-xs text-destructive">{fieldErrors.projectDetail}</span> : null}
                      </label>
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
                          placeholder="介绍你的背景和协作方式"
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
                          placeholder="学校、专业"
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
                          placeholder="做过哪些业务和职责"
                          value={experience}
                        />
                        {fieldErrors.experience ? <span className="text-xs text-destructive">{fieldErrors.experience}</span> : null}
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
                            setProjectDetail(profile?.user.detailedProfile?.projectDetail || '');
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
                      {previewRows.map(([label, value]) => (
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
                    项目详情
                    <Textarea
                      className={cn(fieldErrors.projectDetail ? 'border-destructive focus-visible:ring-destructive/20' : undefined)}
                      name="projectDetail"
                      onChange={(event) => {
                        setProjectDetail(event.target.value);
                        setFieldErrors((previous) => ({ ...previous, projectDetail: getDetailFieldError('projectDetail', event.target.value) }));
                      }}
                      rows={4}
                      placeholder="补充项目细节、成果或能力证明"
                      value={projectDetail}
                    />
                    {fieldErrors.projectDetail ? <span className="text-xs text-destructive">{fieldErrors.projectDetail}</span> : null}
                  </label>
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
                      placeholder="介绍你的背景和协作方式"
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
                      placeholder="学校、专业"
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
                      placeholder="做过哪些业务和职责"
                      value={experience}
                    />
                    {fieldErrors.experience ? <span className="text-xs text-destructive">{fieldErrors.experience}</span> : null}
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

      {card.viewerState?.contactVisible && card.viewerState.contactMethods.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/84 p-5 shadow-[0_14px_34px_rgba(79,108,163,0.12)]">
          <h2 className="text-xl font-semibold text-foreground">已可见联系方式</h2>
          <div className="grid gap-2">
            {card.viewerState.contactMethods.map((contact: ContactMethod) => (
              <div className="rounded-lg border border-border/60 bg-background/74 px-3 py-2" key={contact.id}>
                <strong className="text-sm text-foreground">{contact.type}</strong>
                <p className="text-sm text-muted-foreground">{contact.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
