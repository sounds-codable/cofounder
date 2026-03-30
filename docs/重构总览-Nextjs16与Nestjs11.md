# Cofounder 重构总览（Next.js v16 + NestJS v11）

## 1. 当前目录结构

```text
cofounder/
├── archive/
│   ├── client/   # 旧版 Taro 前端
│   └── server/   # 旧版 NestJS 后端
├── client/       # 全新 Next.js v16 前端
├── server/       # 全新 NestJS v11 后端
├── docs/
└── scripts/
```

## 2. 本次重构目标

- 前端从 `Taro` 重构为 `Next.js v16`
- 后端继续使用 `NestJS v11`
- 数据库继续使用 `PostgreSQL`
- 继续沿用现有 `scripts/` 与 `docs/deployment.md` 的部署思路
- 旧系统不删除，统一归档到 `archive/`

## 3. 新前端的实现方向

当前新的 `client/` 已切到 `Next.js App Router`，并优先完成了以下骨架：

- 首页
- 项目方列表页
- 程序员列表页
- 详情页
- 登录页
- 基础信息录入页
- 详细信息录入页
- 请求中心页

前端构建采用：

- 静态导出
- 最终产物整理到 `client/dist`

这样可以继续兼容现有 Nginx 静态托管方式。

## 4. 新后端的实现方向

新的 `server/` 维持 NestJS + PostgreSQL 架构，并先提供：

- `GET /api/health`
- `GET /api/platform/overview`
- `GET /api/platform/cards`
- `GET /api/platform/cards/:id`
- `GET /api/platform/request-states`

同时已经落下基础实体骨架：

- `users`
- `contact_methods`
- `cards`
- `detail_requests`

## 5. 当前这次重构已完成的事情

- 旧版 `client/`、`server/` 已移到 `archive/`
- 新版 `client/`、`server/` 骨架已创建
- 保持后端端口为 `3010`
- 保持后端环境变量读取位置为 `server/.env`
- 补充了旧版访问说明与本地建库说明

## 6. 后续建议优先级

建议下一步按下面顺序继续推进：

1. 先把前后端依赖安装并跑通构建
2. 再让前端改为真实请求新后端 API
3. 再做登录、收藏、点赞、了解详情、联系方式交换的完整业务闭环
4. 最后补数据库迁移、生产清库方案和正式上线验证
