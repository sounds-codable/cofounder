import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ComplianceLogService } from './compliance-log.service';

type HeaderValue = string | string[] | undefined;

type RequestWithSocket = {
  ip?: string;
  method: string;
  originalUrl?: string;
  path?: string;
  headers: Record<string, HeaderValue>;
  socket?: {
    remoteAddress?: string;
    remotePort?: number;
    localAddress?: string;
    localPort?: number;
  };
};

type ResponseWithStatus = {
  statusCode: number;
  on(event: 'finish', listener: () => void): void;
};

type NextFunction = () => void;

@Injectable()
export class ComplianceAuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ComplianceAuditMiddleware.name);

  constructor(
    private readonly authService: AuthService,
    private readonly complianceLogService: ComplianceLogService,
  ) {}

  use(req: RequestWithSocket, res: ResponseWithStatus, next: NextFunction) {
    const startedAt = Date.now();

    res.on('finish', () => {
      const requestPath = req.originalUrl ?? req.path ?? '/';

      if (!requestPath.startsWith('/api') || requestPath.startsWith('/api/health')) {
        return;
      }

      void this.logRequest(req, res.statusCode, requestPath, startedAt);
    });

    next();
  }

  private async logRequest(req: RequestWithSocket, statusCode: number, requestPath: string, startedAt: number) {
    try {
      const authorization = this.readSingleHeader(req.headers.authorization);
      const user = await this.authService.getOptionalUserFromAuthorizationHeader(authorization);
      const inferredOperationType = this.inferOperationType(req.method, requestPath);

      await this.complianceLogService.recordOperationAudit({
        user,
        operationType: this.truncate(inferredOperationType, 255) ?? 'unknown_operation',
        requestMethod: this.truncate(req.method, 16) ?? req.method,
        requestPath: this.truncate(requestPath, 500) ?? requestPath,
        statusCode: Number.isFinite(statusCode) ? statusCode : null,
        durationMs: Date.now() - startedAt,
        operationAt: new Date(startedAt),
        sourceAddress: this.truncate(req.ip ?? req.socket?.remoteAddress ?? null, 120),
        sourcePort: this.toPort(req.socket?.remotePort),
        destinationAddress: this.truncate(this.extractDestinationAddress(req), 120),
        destinationPort: this.extractDestinationPort(req),
        clientFingerprint: {
          userAgent: this.truncate(this.readSingleHeader(req.headers['user-agent']), 500),
          secChUa: this.truncate(this.readSingleHeader(req.headers['sec-ch-ua']), 500),
          secChUaPlatform: this.truncate(this.readSingleHeader(req.headers['sec-ch-ua-platform']), 120),
          secChUaMobile: this.truncate(this.readSingleHeader(req.headers['sec-ch-ua-mobile']), 120),
          acceptLanguage: this.truncate(this.readSingleHeader(req.headers['accept-language']), 120),
          deviceId: this.truncate(this.readSingleHeader(req.headers['x-device-id']), 120),
        },
        metadata: {
          referer: this.truncate(this.readSingleHeader(req.headers.referer), 500),
          forwardedFor: this.truncate(this.readSingleHeader(req.headers['x-forwarded-for']), 500),
          requestHost: this.truncate(this.readSingleHeader(req.headers.host), 500),
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to write operation audit log: ${message}`);
    }
  }

  private inferOperationType(method: string, requestPath: string) {
    const normalizedMethod = method.toUpperCase();
    const normalizedPath = requestPath.toLowerCase();

    if (normalizedMethod === 'POST' && normalizedPath === '/api/me/basic') {
      return 'publish_basic_profile';
    }

    if (normalizedMethod === 'PUT' && normalizedPath === '/api/me/detail') {
      return 'update_detail_profile';
    }

    if (normalizedMethod === 'POST' && normalizedPath.startsWith('/api/requests')) {
      return 'detail_request_operation';
    }

    return `${normalizedMethod.toLowerCase()}_${normalizedPath.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  }

  private readSingleHeader(value: HeaderValue) {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  }

  private truncate(value: string | null, maxLength: number) {
    if (!value) {
      return null;
    }

    if (value.length <= maxLength) {
      return value;
    }

    return value.slice(0, maxLength);
  }

  private toPort(value?: number) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return null;
    }

    return Math.round(value);
  }

  private extractDestinationAddress(req: RequestWithSocket) {
    const host = this.readSingleHeader(req.headers.host);

    if (host) {
      return host.split(':')[0] || null;
    }

    return req.socket?.localAddress ?? null;
  }

  private extractDestinationPort(req: RequestWithSocket) {
    const host = this.readSingleHeader(req.headers.host);

    if (host?.includes(':')) {
      const [, rawPort] = host.split(':');
      const parsedPort = Number(rawPort);

      if (Number.isFinite(parsedPort) && parsedPort > 0) {
        return Math.round(parsedPort);
      }
    }

    return this.toPort(req.socket?.localPort);
  }
}
