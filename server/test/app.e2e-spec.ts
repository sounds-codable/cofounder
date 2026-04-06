import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { DataSource } from 'typeorm';

type HttpServer = Parameters<typeof request>[0];

describe('Cofounder App (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '0';
    process.env.DB_DATABASE = 'cofounder_e2e';
    process.env.TYPEORM_SYNCHRONIZE = 'true';
    process.env.MAIL_ENABLED = 'false';
    process.env.JWT_SECRET = 'cofounder-e2e-secret';

    await ensureDatabaseExists();
  });

  beforeEach(async () => {
    const imported = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({
      imports: [imported.AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns healthy payload', async () => {
    const response = await request(getHttpServer(app)).get('/api/health').expect(200);

    expect(response.body.service).toBe('cofounder-server');
    expect(response.body.ok).toBe(true);
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('completes login, profile save, request approval and contact exchange flow', async () => {
    const developerSession = await createSession(app, 'developer-e2e@example.com');
    const expertSession = await createSession(app, 'expert-e2e@example.com');

    const developerBasic = await request(getHttpServer(app))
      .put('/api/me/basic')
      .set('Authorization', `Bearer ${developerSession.accessToken}`)
      .send({
        role: 'developer',
        displayName: '联调程序员',
        headline: 'Next.js / NestJS 全栈，希望和真实业务方快速试 MVP',
        basicSummary: '擅长把模糊需求拆成 MVP，愿意先从真实问题切入。',
        city: '上海',
        desiredDirection: 'AI 工具、效率平台',
        strengths: ['Next.js', 'NestJS', 'PostgreSQL'],
      })
      .expect(200);

    expect(developerBasic.body.completion.hasPublicCard).toBe(true);

    await request(getHttpServer(app))
      .put('/api/me/detail')
      .set('Authorization', `Bearer ${developerSession.accessToken}`)
      .send({
        intro: '长期在创业团队做全栈开发。',
        education: '同济大学 / 软件工程',
        experience: '负责过从需求拆解到上线运维的完整链路。',
        projectDetail: '做过内容、AI 与工作流相关产品。',
        wechat: 'dev-e2e-wechat',
        email: 'developer-e2e@example.com',
      })
      .expect(200);

    const expertBasic = await request(getHttpServer(app))
      .put('/api/me/basic')
      .set('Authorization', `Bearer ${expertSession.accessToken}`)
      .send({
        role: 'expert',
        displayName: '联调项目方',
        headline: '做供应链协同工具，想找能一起试 MVP 的程序员',
        basicSummary: '已有真实场景，希望先做一个能快速验证留存的小系统。',
        city: '杭州',
        desiredDirection: '',
        strengths: ['供应链', '线下场景', 'MVP'],
      })
      .expect(200);

    const cardId = expertBasic.body.card.id as string;

    await request(getHttpServer(app))
      .put('/api/me/detail')
      .set('Authorization', `Bearer ${expertSession.accessToken}`)
      .send({
        intro: '长期在供应链行业工作。',
        education: '浙江大学 / 管理学',
        experience: '做过线下渠道、采购协同与运营管理。',
        projectDetail: '希望先验证库存协同与采购预测。',
      })
      .expect(200);

    await request(getHttpServer(app))
      .put('/api/me/contacts')
      .set('Authorization', `Bearer ${expertSession.accessToken}`)
      .send({
        phone: '13800000000',
        wechat: 'expert-e2e-wechat',
        email: 'expert-e2e@example.com',
      })
      .expect(200);

    const createdRequest = await request(getHttpServer(app))
      .post('/api/requests')
      .set('Authorization', `Bearer ${developerSession.accessToken}`)
      .send({ cardId })
      .expect(201);

    expect(createdRequest.body.status).toBe('pending_request');

    const requestId = createdRequest.body.id as string;

    const viewedRequest = await request(getHttpServer(app))
      .post(`/api/requests/${requestId}/view-requester-detail`)
      .set('Authorization', `Bearer ${expertSession.accessToken}`)
      .expect(201);

    expect(viewedRequest.body.status).toBe('publisher_viewed_detail');
    expect(viewedRequest.body.requester.detailedProfile.intro).toBe('长期在创业团队做全栈开发。');

    const approvedRequest = await request(getHttpServer(app))
      .post(`/api/requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${expertSession.accessToken}`)
      .expect(201);

    expect(approvedRequest.body.status).toBe('approved_detail_visible');

    const cardAfterApprove = await request(getHttpServer(app))
      .get(`/api/platform/cards/${encodeURIComponent(cardId)}`)
      .set('Authorization', `Bearer ${developerSession.accessToken}`)
      .expect(200);

    expect(cardAfterApprove.body.viewerState.detailVisible).toBe(true);
    expect(cardAfterApprove.body.viewerState.contactVisible).toBe(false);

    const reviewingMarked = await request(getHttpServer(app))
      .post(`/api/requests/${requestId}/mark-exchange-reviewing`)
      .set('Authorization', `Bearer ${developerSession.accessToken}`)
      .expect(201);

    expect(reviewingMarked.body.status).toBe('approved_detail_visible');
    expect(reviewingMarked.body.exchangeReviewingAt).toBeTruthy();

    const requesterDeclined = await request(getHttpServer(app))
      .post(`/api/requests/${requestId}/decline-contact`)
      .set('Authorization', `Bearer ${developerSession.accessToken}`)
      .send({ reason: '我现在暂时不推进，后续有需要再联系。' })
      .expect(201);

    expect(requesterDeclined.body.status).toBe('requester_declined_contact');
    expect(requesterDeclined.body.requesterDeclinedContactAt).toBeTruthy();

    await request(getHttpServer(app))
      .put('/api/me/contacts')
      .set('Authorization', `Bearer ${developerSession.accessToken}`)
      .send({
        phone: '13900000000',
        wechat: 'dev-e2e-wechat',
        email: 'developer-e2e@example.com',
      })
      .expect(200);

    const exchangedRequest = await request(getHttpServer(app))
      .post(`/api/requests/${requestId}/exchange-contact`)
      .set('Authorization', `Bearer ${developerSession.accessToken}`)
      .expect(201);

    expect(exchangedRequest.body.status).toBe('contact_exchanged');
    expect(exchangedRequest.body.publisher.contactMethods).toHaveLength(3);

    const cardAfterExchange = await request(getHttpServer(app))
      .get(`/api/platform/cards/${encodeURIComponent(cardId)}`)
      .set('Authorization', `Bearer ${developerSession.accessToken}`)
      .expect(200);

    expect(cardAfterExchange.body.viewerState.contactVisible).toBe(true);
    expect(cardAfterExchange.body.viewerState.contactMethods).toHaveLength(3);
  });
});

async function createSession(app: INestApplication, email: string) {
  const sendCodeResponse = await request(getHttpServer(app))
    .post('/api/auth/send-code')
    .send({ email })
    .expect(201);

  const verifyResponse = await request(getHttpServer(app))
    .post('/api/auth/verify-code')
    .send({
      email,
      code: sendCodeResponse.body.devCode,
    })
    .expect(201);

  return {
    accessToken: verifyResponse.body.accessToken as string,
  };
}

async function ensureDatabaseExists() {
  const envValues = readEnvFile();
  const adminConfig = {
    host: process.env.DB_HOST || envValues.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || envValues.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || envValues.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD ?? envValues.DB_PASSWORD ?? 'postgres',
    database: 'postgres',
  };

  const client = new Client(adminConfig);

  try {
    await client.connect();
  } catch {
    const fallbackClient = new Client({
      ...adminConfig,
      database: 'template1',
    });

    await fallbackClient.connect();
    await createDatabaseIfNeeded(fallbackClient, process.env.DB_DATABASE || 'cofounder_e2e');
    await fallbackClient.end();
    return;
  }

  await createDatabaseIfNeeded(client, process.env.DB_DATABASE || 'cofounder_e2e');
  await client.end();
}

 function readEnvFile() {
   const envFilePath = join(__dirname, '..', '.env');

   try {
     const content = readFileSync(envFilePath, 'utf8');

     return content.split(/\r?\n/).reduce<Record<string, string>>((accumulator, line) => {
       if (!line || line.startsWith('#') || !line.includes('=')) {
         return accumulator;
       }

       const [key, ...rest] = line.split('=');
       accumulator[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
       return accumulator;
     }, {});
   } catch {
     return {};
   }
 }

async function createDatabaseIfNeeded(client: Client, databaseName: string) {
  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);

  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE "${databaseName}"`);
  }
}

function getHttpServer(app: INestApplication): HttpServer {
  return app.getHttpServer() as unknown as HttpServer;
}
