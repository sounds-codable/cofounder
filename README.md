# 叩饭（Cofounder）

 **行业专家 × 程序员 = 合伙创业**

 > 不是雇佣，是合伙；先做 MVP，再决定是否进一步深度协作。

叩饭（Cofounder）是一个连接项目方（行业专家）与程序员的协作平台。平台强调：

 - 基础信息公开
 - 详细信息只填一次
 - “了解详情”需要授权
 - 联系方式通过第二步动作交换

## 快速命令
- 本地开发 ./scripts/dev.sh

## 当前状态

 当前仓库已经进入**实际重构阶段**：

 - 旧版 `client/`、`server/` 已移入 `archive/`
 - 新版前端已切换为 `Next.js v16`
 - 新版后端已切换为全新的 `NestJS v11` 骨架
 - 部署入口仍然保留：`scripts/` 与 `docs/deployment.md`

## 当前目录结构

```text
cofounder/
 ├── archive/
 │   ├── client/   # 旧版 Taro 前端
 │   └── server/   # 旧版 NestJS 后端
 ├── client/       # 全新 Next.js v16 前端
 ├── server/       # 全新 NestJS v11 后端
 ├── docs/
 ├── scripts/
 ├── temp/
 └── README.md
```

## 核心业务规则

 - **[双角色]** 平台包含项目方（行业专家）与程序员两个角色
 - **[基础信息公开]** 未登录用户只能浏览双方的基础信息
 - **[登录后互动]** 收藏、点赞、了解详情都要求先登录
 - **[渐进式录入]** 用户先填写最少基础信息，只有在需要更深入沟通时再填写详细信息
 - **[详细信息只填一次]** 一次填写，后续请求复用
 - **[双阶段解锁]** 先开放详细信息，再通过单独动作交换联系方式
 - **[禁止自看]** 发布者不能对自己发起“了解详情”

## 新技术栈

| 层级 | 当前实现 |
|------|----------|
| **前端** | `Next.js v16` + App Router + 静态导出到 `client/dist` |
| **后端** | `NestJS v11` |
| **数据库** | PostgreSQL |
| **本地开发库** | `cofounder_new` |
| **服务器数据库** | 保持原库名不变，后续清空旧数据 |

## 当前已落地内容

### 前端

新前端骨架已包含：

 - 首页
 - 项目方列表页
 - 程序员列表页
 - 卡片详情页
 - 登录页
 - 基础信息录入页
 - 详细信息录入页
 - 请求中心页

### 后端

新后端骨架已包含：

 - `GET /api/health`
 - `GET /api/platform/overview`
 - `GET /api/platform/cards`
 - `GET /api/platform/cards/:id`
 - `GET /api/platform/request-states`

并已建立基础实体骨架：

 - `users`
 - `contact_methods`
 - `cards`
 - `detail_requests`

## 本地开发

### 环境要求

 - Node.js >= 18
 - PostgreSQL >= 15

### 1. 创建本地数据库

参考文档：

 - `docs/mac本地PostgreSQL创建cofounder_new.md`

### 2. 配置后端环境变量

```bash
cp server/.env.example server/.env
```

说明：

 - 后端配置以 `server/.env` 为准
 - 根目录 `.env` 不影响 NestJS 服务数据库连接
 - 默认开发端口为 `3010`

### 3. 启动新后端

```bash
npm install --prefix server
npm run start:dev --prefix server
```

启动后访问：`http://localhost:3010/api/health`

### 4. 启动新前端

```bash
npm install --prefix client
npm run dev --prefix client
```

启动后访问：`http://localhost:3000`

## 旧版归档访问

旧版系统仍可在本地继续查看，说明文档见：

 - `docs/旧版归档访问说明.md`

## 部署

当前部署方式保持不变，继续使用：

 - `scripts/deploy.sh`
 - `docs/deployment.md`

新前端虽然改成了 Next.js，但仍会在构建后整理产物到：

 - `client/dist/`

因此 Nginx 静态托管方式可以继续沿用。

## 关键文档

 - `docs/产品需求文档-角色双向授权与Nextjs重构.md`
 - `docs/重构总览-Nextjs16与Nestjs11.md`
 - `docs/旧版归档访问说明.md`
 - `docs/mac本地PostgreSQL创建cofounder_new.md`
 - `docs/服务器端原库清空说明.md`
 - `docs/deployment.md`

## 下一步建议

 - **[第一步]** 安装前后端依赖并跑通构建
 - **[第二步]** 让前端改为真实请求新的 NestJS API
 - **[第三步]** 完成登录、收藏、点赞、了解详情、联系方式交换的完整闭环
 - **[第四步]** 补正式 migration 与生产清库上线方案
