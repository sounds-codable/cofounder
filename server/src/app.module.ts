import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';
import { MailService } from './auth/mail.service';
import { AuthService } from './auth/auth.service';
import { ContactMethod } from './contacts/contact-method.entity';
import { HealthController } from './health/health.controller';
import { MeController } from './me/me.controller';
import { MeService } from './me/me.service';
import { Card } from './platform/card.entity';
import { DetailRequest } from './platform/detail-request.entity';
import { PlatformController } from './platform/platform.controller';
import { PlatformService } from './platform/platform.service';
import { SeedService } from './platform/seed.service';
import { PublicWelfareController } from './public-welfare/public-welfare.controller';
import { PublicWelfareMessage } from './public-welfare/public-welfare-message.entity';
import { PublicWelfareService } from './public-welfare/public-welfare.service';
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
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<string>('DB_PORT', '5432')),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'cofounder_new'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('TYPEORM_SYNCHRONIZE', 'true') === 'true',
        logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
    TypeOrmModule.forFeature([User, ContactMethod, Card, DetailRequest, PublicWelfareMessage]),
  ],
  controllers: [HealthController, PlatformController, AuthController, MeController, RequestsController, PublicWelfareController],
  providers: [PlatformService, SeedService, AuthService, MailService, MeService, RequestsService, PublicWelfareService],
})
export class AppModule {}
