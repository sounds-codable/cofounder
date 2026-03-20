import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { DevelopersModule } from './developers/developers.module';
import { ProjectOwnersModule } from './project-owners/project-owners.module';
import { RequestsModule } from './requests/requests.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { MailModule } from './mail/mail.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') === 'development', // 开发环境自动同步
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // 业务模块
    AuthModule,
    UsersModule,
    ProjectsModule,
    DevelopersModule,
    ProjectOwnersModule,
    RequestsModule,
    WaitlistModule,
    MailModule,
  ],
  providers: [
    // 全局 JWT 认证守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
