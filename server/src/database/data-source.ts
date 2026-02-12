import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'hehuozao',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: false, // 生产环境永远不要开启
  logging: process.env.NODE_ENV === 'development',
};

// 用于 TypeORM CLI 的 DataSource 实例
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;

