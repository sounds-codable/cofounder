import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { AuthController } from './auth/auth.controller';
import { MailService } from './auth/mail.service';
import { AuthService } from './auth/auth.service';
import { ComplianceAuditMiddleware } from './compliance/compliance-audit.middleware';
import { ContentModerationService } from './compliance/content-moderation.service';
import { ComplianceLogService } from './compliance/compliance-log.service';
import { OperationAuditLog } from './compliance/operation-audit-log.entity';
import { PublishedContentRecord } from './compliance/published-content-record.entity';
import { ContactMethod } from './contacts/contact-method.entity';
import { HealthController } from './health/health.controller';
import { MeController } from './me/me.controller';
import { MeService } from './me/me.service';
import { CardEngagement } from './platform/card-engagement.entity';
import { Card } from './platform/card.entity';
import { CardTag } from './platform/card-tag.entity';
import { DetailRequest } from './platform/detail-request.entity';
import { PlatformController } from './platform/platform.controller';
import { PlatformService } from './platform/platform.service';
import { SeedService } from './platform/seed.service';
import { Tag } from './platform/tag.entity';
import { PublicWelfareController } from './public-welfare/public-welfare.controller';
import { PublicWelfareMessage } from './public-welfare/public-welfare-message.entity';
import { PublicWelfareService } from './public-welfare/public-welfare.service';
import { RewardTransaction } from './rewards/reward-transaction.entity';
import { RewardService } from './rewards/reward.service';
import { RequestsController } from './requests/requests.controller';
import { RequestsService } from './requests/requests.service';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<string>('DB_PORT', '5432')),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'cofounder_new'),
        type: 'postgres',
        autoLoadEntities: true,
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: configService.get<string>('TYPEORM_SYNCHRONIZE', 'false') === 'true',
        migrationsRun: configService.get<string>('TYPEORM_MIGRATIONS_RUN', 'true') === 'true',
        logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      ContactMethod,
      Card,
      DetailRequest,
      Tag,
      CardTag,
      PublicWelfareMessage,
      RewardTransaction,
      CardEngagement,
      OperationAuditLog,
      PublishedContentRecord,
    ]),
  ],
  controllers: [HealthController, PlatformController, AuthController, MeController, RequestsController, PublicWelfareController, AdminController],
  providers: [
    PlatformService,
    SeedService,
    AuthService,
    MailService,
    MeService,
    RequestsService,
    PublicWelfareService,
    RewardService,
    AdminService,
    ComplianceLogService,
    ContentModerationService,
    ComplianceAuditMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ComplianceAuditMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
