import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ContactMethod } from '../contacts/contact-method.entity';
import { CardEngagement } from '../platform/card-engagement.entity';
import { CardTag } from '../platform/card-tag.entity';
import { Card } from '../platform/card.entity';
import { DetailRequest } from '../platform/detail-request.entity';
import { Tag } from '../platform/tag.entity';
import { PublicWelfareMessage } from '../public-welfare/public-welfare-message.entity';
import { RewardTransaction } from '../rewards/reward-transaction.entity';
import { User } from '../users/user.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'cofounder_new',
  entities: [User, ContactMethod, Card, DetailRequest, Tag, CardTag, PublicWelfareMessage, RewardTransaction, CardEngagement],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
