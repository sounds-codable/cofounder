export type UserRole = 'expert' | 'developer';

export type PublicCard = {
  id: string;
  role: UserRole;
  ownerName?: string;
  headline: string;
  city: string;
  basicSummary: string;
  optionalDirection?: string;
  strengths: string[];
  detailPreview: {
    intro: string;
    education: string;
    experience: string;
    projectDetail: string;
  };
};

export type RequestState = {
  key: string;
  label: string;
  description: string;
};

export const roleLabels: Record<UserRole, string> = {
  expert: '项目方 / 行业专家',
  developer: '程序员',
};

export const fallbackPublicCards: PublicCard[] = [
  {
    id: 'expert-medical-chain',
    role: 'expert',
    headline: '做基层医疗供应链效率平台，已验证线下需求，想找能一起做 MVP 的程序员',
    city: '杭州',
    basicSummary: '已跑通若干真实商户场景，现希望和愿意长期协作的技术合伙人一起做第一版。',
    strengths: ['医药流通', '线下渠道', '真实订单', 'MVP 优先'],
    detailPreview: {
      intro: '连续创业者，长期在医疗供应链行业工作，熟悉上下游采购、库存、账期管理。',
      education: '浙江大学 / 管理学',
      experience: '做过区域供应链整合、SaaS 商业化、团队搭建。',
      projectDetail: '想从库存协同、采购预测切入，先做一个让门店每天愿意打开的轻量系统。',
    },
  },
  {
    id: 'expert-cross-border-brand',
    role: 'expert',
    headline: '跨境品牌出海项目寻找全栈程序员，希望一起快速验证 AI 增长工具方向',
    city: '深圳',
    basicSummary: '供应链和渠道资源较成熟，希望在内容生产、广告投放、CRM 自动化之间找到最小切口。',
    strengths: ['跨境电商', '增长投放', '品牌运营', '资源整合'],
    detailPreview: {
      intro: '长期做品牌出海，熟悉欧美平台规则与团队协作。',
      education: '中山大学 / 市场营销',
      experience: '主导过从 0 到 1 品牌搭建、投放策略、私域转化。',
      projectDetail: '希望找到既能动手写系统，又能理解业务转化链路的技术合伙人。',
    },
  },
  {
    id: 'developer-growth-fullstack',
    role: 'developer',
    headline: 'React / Next.js / NestJS 全栈，做过增长与内容产品，想找能快速试错的真实业务方',
    city: '上海',
    basicSummary: '擅长把模糊需求快速拆成 MVP，偏好内容、AI 工具、效率平台方向。',
    optionalDirection: '内容工具、AI 工作流、效率平台',
    strengths: ['Next.js', 'NestJS', 'PostgreSQL', '增长实验'],
    detailPreview: {
      intro: '过去几年一直在创业团队与小型产品团队做全栈开发。',
      education: '同济大学 / 软件工程',
      experience: '负责过从产品设计到上线运维的完整链路。',
      projectDetail: '做过 AI 文案、知识管理、工作流自动化、订阅转化系统。',
    },
  },
  {
    id: 'developer-data-ai',
    role: 'developer',
    headline: '数据工程 + AI 应用开发，做过推荐与智能分析，希望参与更懂行业问题的项目',
    city: '北京',
    basicSummary: '偏后端和数据方向，喜欢把行业 know-how 结构化成真正能跑的产品。',
    optionalDirection: '产业互联网、AI 分析、企业工具',
    strengths: ['Python', '数据平台', 'LLM 集成', '后端架构'],
    detailPreview: {
      intro: '长期做数据产品与企业内部工具，有较强的问题建模能力。',
      education: '北京航空航天大学 / 计算机科学',
      experience: '做过数据中台、画像分析、智能推荐、企业 AI Copilot。',
      projectDetail: '希望与强行业资源方合作，做有真实需求、有壁垒的产品。',
    },
  },
];

export const staticCardSlugs = fallbackPublicCards.map((card) => card.id);

export const flowSteps = [
  {
    title: '项目方先发项目简介',
    description: '公开基础信息，程序员先判断是否值得申请了解详情。',
  },
  {
    title: '项目方先做决定',
    description: '项目方先看程序员详细信息，再决定是否开放项目详情。',
  },
  {
    title: '程序员再决定是否交换联系方式',
    description: '程序员看到项目详情后，再决定是否互看联系方式并继续沟通。',
  },
];

export const visibilityRules = [
  {
    title: '未登录用户',
    visible: ['项目方基础信息', '程序员基础信息'],
    hidden: ['收藏', '点赞', '了解详情', '详细信息', '联系方式'],
  },
  {
    title: '已登录意向者',
    visible: ['收藏', '点赞', '发送了解详情请求'],
    hidden: ['对方详细信息', '对方联系方式'],
  },
  {
    title: '发布者处理请求',
    visible: ['请求者基础信息', '请求者详细信息打码预览'],
    hidden: ['请求者联系方式', '未先查看详细信息时的同意/拒绝权限'],
  },
  {
    title: '双方完成联系交换后',
    visible: ['对方授权的详细信息', '本次被交换的联系方式'],
    hidden: ['未授权的其他联系方式'],
  },
];

export const fallbackRequestStates: RequestState[] = [
  {
    key: 'pending_request',
    label: '待发布者处理',
    description: '意向者已发送请求，等待发布者查看并决定是否继续。',
  },
  {
    key: 'publisher_viewed_detail',
    label: '发布者已查看详细信息',
    description: '发布者已经看过未打码详细信息，但仍未同意或拒绝。',
  },
  {
    key: 'approved_detail_visible',
    label: '已同意查看详细信息',
    description: '意向者能看到发布者详细信息，但还不能看到联系方式。',
  },
  {
    key: 'contact_exchanged',
    label: '已交换联系方式',
    description: '双方已经完成一次双向联系方式交换。',
  },
];
