import { BadRequestException, ValidationError } from '@nestjs/common';

const FIELD_LABELS: Record<string, string> = {
  email: '邮箱',
  inviteCode: '邀请码',
  code: '验证码',
  role: '角色',
  headline: '标题',
  basicSummary: '个人简介',
  city: '城市',
  desiredDirection: '偏好方向',
  strengths: '标签/技能',
  riskConfirmed: '风险确认状态',
  intro: '个人简介',
  education: '教育背景',
  experience: '工作背景',
  expertProjectDetail: '项目详情',
  developerProjectExperience: '做过的项目/产品',
  projectDetail: '项目详情',
  phone: '电话',
  wechat: '微信',
  qq: 'QQ',
  other: '其他联系方式',
  displayName: '称呼',
  cardId: '卡片',
  reason: '原因',
  title: '标题',
  summary: '摘要',
  contentMarkdown: '博客内容',
  content: '内容',
  parentCommentId: '父评论',
  published: '发布状态',
  status: '审核状态',
  type: '类型',
  active: '状态',
  name: '称呼',
  contact: '联系方式',
  message: '留言内容',
};

function prettifyFieldName(propertyPath: string) {
  const lastSegment = propertyPath.split('.').pop() || propertyPath;
  return FIELD_LABELS[lastSegment] || lastSegment;
}

function containsChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(text);
}

function translateConstraintMessage(message: string, propertyPath: string) {
  if (!message) {
    return '提交内容不符合要求';
  }

  if (containsChinese(message)) {
    return message;
  }

  const fieldLabel = prettifyFieldName(propertyPath);
  const normalized = message.replace(/`/g, '').trim();

  let match = normalized.match(/^(.+?) must be longer than or equal to (\d+) characters$/i);
  if (match) {
    return `${fieldLabel}不能少于 ${match[2]} 个字符`;
  }

  match = normalized.match(/^(.+?) must be shorter than or equal to (\d+) characters$/i);
  if (match) {
    return `${fieldLabel}不能超过 ${match[2]} 个字符`;
  }

  match = normalized.match(/^(.+?) must be equal to (\d+) characters$/i);
  if (match) {
    return `${fieldLabel}长度必须为 ${match[2]} 个字符`;
  }

  match = normalized.match(/^(.+?) must be longer than or equal to (\d+)$/i);
  if (match) {
    return `${fieldLabel}不能小于 ${match[2]}`;
  }

  match = normalized.match(/^(.+?) must be shorter than or equal to (\d+)$/i);
  if (match) {
    return `${fieldLabel}不能大于 ${match[2]}`;
  }

  match = normalized.match(/^each value in (.+?) must be a string$/i);
  if (match) {
    return `${fieldLabel}中的每一项都必须是文本`;
  }

  match = normalized.match(/^(.+?) must contain at least (\d+) elements$/i);
  if (match) {
    return `${fieldLabel}至少需要 ${match[2]} 项`;
  }

  match = normalized.match(/^(.+?) must contain no more than (\d+) elements$/i);
  if (match) {
    return `${fieldLabel}最多只能有 ${match[2]} 项`;
  }

  match = normalized.match(/^(.+?) must be one of the following values: (.+)$/i);
  if (match) {
    return `${fieldLabel}取值无效，可选值为：${match[2]}`;
  }

  if (/must be a string$/i.test(normalized)) {
    return `${fieldLabel}格式不正确`;
  }

  if (/must be a boolean value$/i.test(normalized)) {
    return `${fieldLabel}格式不正确`;
  }

  if (/must be an email$/i.test(normalized)) {
    return `${fieldLabel}格式不正确`;
  }

  if (/must be an array$/i.test(normalized)) {
    return `${fieldLabel}格式不正确`;
  }

  if (/must be a UUID$/i.test(normalized)) {
    return `${fieldLabel}格式不正确`;
  }

  if (/must be a URL address$/i.test(normalized)) {
    return `${fieldLabel}格式不正确`;
  }

  if (/must match/i.test(normalized)) {
    return `${fieldLabel}格式不正确`;
  }

  if (/should not be empty$/i.test(normalized)) {
    return `请填写${fieldLabel}`;
  }

  if (/must be a number conforming to the specified constraints$/i.test(normalized)) {
    return `${fieldLabel}格式不正确`;
  }

  return `${fieldLabel}格式不正确`;
}

function collectMessages(errors: ValidationError[], parentPath = ''): string[] {
  return errors.flatMap((error) => {
    const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property;
    const currentMessages = Object.values(error.constraints ?? {}).map((message) =>
      translateConstraintMessage(message, propertyPath),
    );
    const childMessages = error.children?.length ? collectMessages(error.children, propertyPath) : [];

    return [...currentMessages, ...childMessages];
  });
}

export function createChineseValidationException(errors: ValidationError[]) {
  const messages = [...new Set(collectMessages(errors))];

  return new BadRequestException({
    message: messages.length ? messages : ['提交内容不符合要求'],
    error: 'Bad Request',
    statusCode: 400,
  });
}
