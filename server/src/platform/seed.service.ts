import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMethod } from '../contacts/contact-method.entity';
import { ContactType } from '../common/enums/contact-type.enum';
import { DetailRequestStatus } from '../common/enums/detail-request-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/user.entity';
import { Card } from './card.entity';
import { DetailRequest } from './detail-request.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(ContactMethod)
    private readonly contactMethodRepository: Repository<ContactMethod>,
    @InjectRepository(DetailRequest)
    private readonly detailRequestRepository: Repository<DetailRequest>,
  ) {}

  async onModuleInit() {
    const existingCardCount = await this.cardRepository.count();

    if (existingCardCount > 0) {
      return;
    }

    const expertMedical = this.userRepository.create({
      displayName: '陈医生',
      detailedProfile: {
        intro: '长期在医疗供应链行业工作，熟悉采购、库存、账期问题。',
        education: '浙江大学 / 管理学',
        experience: '主导过区域供应链整合、线下渠道协同。',
        expertProjectDetail: '先从门店日常采购协同切入，验证真实留存。',
        developerProjectExperience: '',
        projectDetail: '先从门店日常采购协同切入，验证真实留存。',
      },
      detailedProfileCompletedAt: new Date(),
    });

    const expertBrand = this.userRepository.create({
      displayName: '周岚',
      detailedProfile: {
        intro: '长期做品牌出海，熟悉欧美平台规则与团队协作。',
        education: '中山大学 / 市场营销',
        experience: '主导过从 0 到 1 品牌搭建、投放策略、私域转化。',
        expertProjectDetail: '希望先在内容生产、投放自动化和 CRM 协同之间找到最小切口。',
        developerProjectExperience: '',
        projectDetail: '希望先在内容生产、投放自动化和 CRM 协同之间找到最小切口。',
      },
      detailedProfileCompletedAt: new Date(),
    });

    const developerGrowth = this.userRepository.create({
      displayName: '林工',
      detailedProfile: {
        intro: '过去几年一直在创业团队与小型产品团队做全栈开发。',
        education: '同济大学 / 软件工程',
        experience: '负责过从需求拆解到部署上线的完整链路。',
        expertProjectDetail: '',
        developerProjectExperience: '做过 AI 文案、知识管理、工作流自动化、订阅转化系统。',
        projectDetail: '做过 AI 文案、知识管理、工作流自动化、订阅转化系统。',
      },
      detailedProfileCompletedAt: new Date(),
    });

    const developerData = this.userRepository.create({
      displayName: '许原',
      detailedProfile: {
        intro: '长期做数据产品与企业内部工具，有较强的问题建模能力。',
        education: '北京航空航天大学 / 计算机科学',
        experience: '做过数据中台、画像分析、智能推荐、企业 AI Copilot。',
        expertProjectDetail: '',
        developerProjectExperience: '希望与强行业资源方合作，做有真实需求、有壁垒的产品。',
        projectDetail: '希望与强行业资源方合作，做有真实需求、有壁垒的产品。',
      },
      detailedProfileCompletedAt: new Date(),
    });

    await this.userRepository.save([expertMedical, expertBrand, developerGrowth, developerData]);

    await this.contactMethodRepository.save([
      this.contactMethodRepository.create({
        user: expertMedical,
        type: ContactType.WECHAT,
        value: 'doctor-chen',
        isPrimary: true,
      }),
      this.contactMethodRepository.create({
        user: expertBrand,
        type: ContactType.EMAIL,
        value: 'zhoulan@example.com',
        isPrimary: true,
      }),
      this.contactMethodRepository.create({
        user: developerGrowth,
        type: ContactType.EMAIL,
        value: 'lin@example.com',
        isPrimary: true,
      }),
      this.contactMethodRepository.create({
        user: developerData,
        type: ContactType.WECHAT,
        value: 'data-xuyuan',
        isPrimary: true,
      }),
    ]);

    const expertMedicalCard = this.cardRepository.create({
      slug: 'expert-medical-chain',
      owner: expertMedical,
      role: UserRole.EXPERT,
      headline: '做基层医疗供应链效率平台，已验证线下需求，想找能一起做 MVP 的程序员',
      city: '杭州',
      basicSummary: '已跑通若干真实商户场景，现希望和愿意长期协作的技术合伙人一起做第一版。',
      optionalDirection: null,
      strengths: ['医药流通', '线下渠道', '真实订单', 'MVP 优先'],
      detailPreview: {
        intro: '连续创业者，长期在医疗供应链行业工作，熟悉上下游采购、库存、账期管理。',
        education: '浙江大学 / 管理学',
        experience: '做过区域供应链整合、SaaS 商业化、团队搭建。',
        expertProjectDetail: '想从库存协同、采购预测切入，先做一个让门店每天愿意打开的轻量系统。',
        developerProjectExperience: '',
        projectDetail: '想从库存协同、采购预测切入，先做一个让门店每天愿意打开的轻量系统。',
      },
    });

    const expertBrandCard = this.cardRepository.create({
      slug: 'expert-cross-border-brand',
      owner: expertBrand,
      role: UserRole.EXPERT,
      headline: '跨境品牌出海项目寻找全栈程序员，希望一起快速验证 AI 增长工具方向',
      city: '深圳',
      basicSummary: '供应链和渠道资源较成熟，希望在内容生产、广告投放、CRM 自动化之间找到最小切口。',
      optionalDirection: null,
      strengths: ['跨境电商', '增长投放', '品牌运营', '资源整合'],
      detailPreview: {
        intro: '长期做品牌出海，熟悉欧美平台规则与团队协作。',
        education: '中山大学 / 市场营销',
        experience: '主导过从 0 到 1 品牌搭建、投放策略、私域转化。',
        expertProjectDetail: '希望找到既能动手写系统，又能理解业务转化链路的技术合伙人。',
        developerProjectExperience: '',
        projectDetail: '希望找到既能动手写系统，又能理解业务转化链路的技术合伙人。',
      },
    });

    const developerGrowthCard = this.cardRepository.create({
      slug: 'developer-growth-fullstack',
      owner: developerGrowth,
      role: UserRole.DEVELOPER,
      headline: 'React / Next.js / NestJS 全栈，做过增长与内容产品，想找能快速试错的真实业务方',
      city: '上海',
      basicSummary: '擅长把模糊需求快速拆成 MVP，偏好内容、AI 工具、效率平台方向。',
      optionalDirection: '内容工具、AI 工作流、效率平台',
      strengths: ['Next.js', 'NestJS', 'PostgreSQL', '增长实验'],
      detailPreview: {
        intro: '过去几年一直在创业团队与小型产品团队做全栈开发。',
        education: '同济大学 / 软件工程',
        experience: '负责过从产品设计到上线运维的完整链路。',
        expertProjectDetail: '',
        developerProjectExperience: '做过 AI 文案、知识管理、工作流自动化、订阅转化系统。',
        projectDetail: '做过 AI 文案、知识管理、工作流自动化、订阅转化系统。',
      },
    });

    const developerDataCard = this.cardRepository.create({
      slug: 'developer-data-ai',
      owner: developerData,
      role: UserRole.DEVELOPER,
      headline: '数据工程 + AI 应用开发，做过推荐与智能分析，希望参与更懂行业问题的项目',
      city: '北京',
      basicSummary: '偏后端和数据方向，喜欢把行业 know-how 结构化成真正能跑的产品。',
      optionalDirection: '产业互联网、AI 分析、企业工具',
      strengths: ['Python', '数据平台', 'LLM 集成', '后端架构'],
      detailPreview: {
        intro: '长期做数据产品与企业内部工具，有较强的问题建模能力。',
        education: '北京航空航天大学 / 计算机科学',
        experience: '做过数据中台、画像分析、智能推荐、企业 AI Copilot。',
        expertProjectDetail: '',
        developerProjectExperience: '希望与强行业资源方合作，做有真实需求、有壁垒的产品。',
        projectDetail: '希望与强行业资源方合作，做有真实需求、有壁垒的产品。',
      },
    });

    await this.cardRepository.save([expertMedicalCard, expertBrandCard, developerGrowthCard, developerDataCard]);

    await this.detailRequestRepository.save([
      this.detailRequestRepository.create({
        publisher: expertMedical,
        requester: developerGrowth,
        targetCard: expertMedicalCard,
        status: DetailRequestStatus.PENDING_REQUEST,
        rejectionReason: null,
        publisherViewedRequesterDetailAt: null,
        approvedAt: null,
        contactExchangedAt: null,
      }),
      this.detailRequestRepository.create({
        publisher: expertBrand,
        requester: developerData,
        targetCard: expertBrandCard,
        status: DetailRequestStatus.APPROVED_DETAIL_VISIBLE,
        rejectionReason: null,
        publisherViewedRequesterDetailAt: new Date(),
        approvedAt: new Date(),
        contactExchangedAt: null,
      }),
    ]);

    this.logger.log('Seeded initial cofounder demo data');
  }
}
