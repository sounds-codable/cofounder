import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { createChineseValidationException } from './common/validation/validation-messages';

function parseAllowedOrigins() {
  const configured = process.env.CORS_ALLOWED_ORIGINS || '';
  const fromEnv = configured
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (fromEnv.length > 0) {
    return fromEnv;
  }

  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://cofounder.icu',
    'https://www.cofounder.icu',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  const nodeEnv = process.env.NODE_ENV || 'development';
  const trustProxy = (process.env.TRUST_PROXY || 'true') === 'true';
  const allowedOrigins = parseAllowedOrigins();
  const bodyLimitKb = Number(process.env.REQUEST_BODY_LIMIT_KB || '256');
  const resolvedBodyLimitKb = Number.isFinite(bodyLimitKb) && bodyLimitKb > 0 ? Math.round(bodyLimitKb) : 256;

  if (trustProxy) {
    expressApp.set('trust proxy', 1);
  }

  expressApp.disable('x-powered-by');
  app.use(json({ limit: `${resolvedBodyLimitKb}kb` }));
  app.use(urlencoded({ extended: true, limit: `${resolvedBodyLimitKb}kb` }));

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: nodeEnv === 'production' ? allowedOrigins : true,
    credentials: true,
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    const forwardedProto = req.headers['x-forwarded-proto'];
    const isHttps = req.secure || forwardedProto === 'https';
    if (isHttps) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      exceptionFactory: createChineseValidationException,
    }),
  );

  const port = Number(process.env.PORT ?? 3010);
  await app.listen(port);
}

void bootstrap();
