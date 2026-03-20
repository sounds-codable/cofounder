# 🤝 叩饭（Cofounder）

**行业专家 × 程序员 = 合伙创业**

> 不是雇佣，是合伙；不谈工资，谈股权；先做MVP，再定分配。

叩饭（Cofounder）是一个连接行业专家与程序员的合伙创业平台。项目方发布创业项目，程序员浏览并申请合伙，双方互相认可后解锁联系方式，开始合作。

## 📋 核心功能

- **双广场模式**：项目广场（程序员浏览项目）+ 程序员广场（项目方浏览程序员）
- **渐进式信息收集**：基础资料 → 详细资料，降低注册门槛
- **双向合伙请求**：程序员申请项目 / 项目方邀请程序员，双方同意后才能查看联系方式
- **邮箱验证码登录**：无需密码，邮箱 + 一次性验证码

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | [Taro](https://taro.zone/) 4.x + React 18 |
| **后端** | [NestJS](https://nestjs.com/) 10.x |
| **数据库** | PostgreSQL 17 |
| **ORM** | TypeORM |
| **认证** | JWT + 邮箱验证码 |

## 📁 项目结构

```
34create/
├── client/          # 前端 (Taro H5 + 微信小程序)
│   ├── config/      # Taro 配置
│   ├── src/
│   │   ├── pages/   # 页面组件
│   │   ├── services/# API 服务
│   │   └── utils/   # 工具函数
│   └── package.json
├── server/          # 后端 (NestJS)
│   ├── src/
│   │   ├── auth/    # 认证模块
│   │   ├── users/   # 用户模块
│   │   ├── projects/# 项目模块
│   │   ├── developers/ # 程序员模块
│   │   ├── requests/# 合伙请求模块
│   │   └── mail/    # 邮件服务
│   └── package.json
└── README.md
```

## 🚀 本地开发

### 环境要求

- Node.js ≥ 18
- PostgreSQL ≥ 15

### 1. 安装 PostgreSQL

```bash
# macOS
brew install postgresql@17
brew services start postgresql@17
createdb hehuozao
```

### 2. 启动后端

```bash
cd server
npm install
cp .env.example .env  # 编辑 .env 配置数据库连接
npm run start:dev
```

后端运行在 http://localhost:3000

### 3. 启动前端

```bash
cd client
npm install --legacy-peer-deps
npm run dev:h5
```

前端运行在 http://localhost:10086

### 4. 测试登录

开发环境下验证码会打印到后端控制台：

```
======================================
📧 发送验证码到: test@example.com
🔑 验证码: 123456
⏰ 有效期: 10分钟
======================================
```

## ⚙️ 环境变量

复制 `server/.env.example` 为 `server/.env`，配置以下变量：

| 变量 | 说明 | 开发默认值 |
|------|------|-----------|
| `NODE_ENV` | 环境 | `development` |
| `DB_HOST` | 数据库地址 | `localhost` |
| `DB_PORT` | 数据库端口 | `5432` |
| `DB_DATABASE` | 数据库名 | `hehuozao` |
| `JWT_SECRET` | JWT 密钥 | - |
| `MAIL_HOST` | SMTP 服务器（仅生产） | - |
| `MAIL_USER` | 邮箱账号（仅生产） | - |
| `MAIL_PASS` | SMTP 授权码（仅生产） | - |

## 📦 微信小程序编译与发布

下面是从开发到正式上线的完整流程（基于 Taro）。

### 0. 发布前准备

1. 在微信公众平台创建小程序，拿到 `AppID`。  
2. 后端 API 必须有公网 **HTTPS** 域名（小程序不支持 `localhost` 直连）。  
3. 在小程序后台配置服务器域名：
   - 登录微信公众平台 → 开发管理 → 开发设置 → 服务器域名
   - 把你的后端域名加到 `request 合法域名`
   - 示例：`https://api.yourdomain.com`

### 1. 配置前端小程序项目

编辑 `client/project.config.json`：

```json
{
  "appid": "你的小程序AppID",
  "miniprogramRoot": "./dist"
}
```

> 默认 `touristappid` 仅用于体验，不可用于正式发布。

### 2. 配置接口地址（重点）

小程序环境不能依赖 H5 的 `/api` 代理，必须使用真实 HTTPS API 地址。  
请在前端 API 配置中确认小程序使用的是公网地址（例如 `https://api.yourdomain.com/api`）。

建议发布前在微信开发者工具里重点验证：
- 登录发送验证码
- 项目列表/详情
- 合伙请求收发

### 3. 本地编译小程序

```bash
cd client
npm install --legacy-peer-deps

# 开发调试（监听）
npm run dev:weapp

# 生产编译（打包）
npm run build:weapp
```

编译产物目录：`client/dist`

### 4. 微信开发者工具上传

1. 打开微信开发者工具  
2. 选择“导入项目”，项目目录选 `client`（会读取 `project.config.json`）  
3. 确认编译正常后，点击“上传”  
4. 填写版本号（如 `1.0.0`）和项目备注

### 5. 提审与发布

1. 登录微信公众平台  
2. 进入「版本管理」找到刚上传的开发版本  
3. 提交审核（按要求填写类目、功能说明、测试账号等）  
4. 审核通过后点击发布

### 6. 常见问题排查

- **请求失败 / 域名不合法**：检查小程序后台 `request 合法域名` 是否配置且为 HTTPS。  
- **登录接口本地可用，小程序不可用**：通常是接口地址仍在用 `localhost` 或 `/api` 代理。  
- **上传时报 `appid` 问题**：确认 `client/project.config.json` 已替换成真实 AppID。  

## 📱 页面说明

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/pages/index/index` | 品牌展示 + 登录入口 |
| 登录 | `/pages/login/index` | 邮箱验证码登录 |
| 完善资料 | `/pages/onboarding/index` | 新用户基础资料填写 |
| 项目广场 | `/pages/projects/index` | 浏览所有项目 |
| 项目详情 | `/pages/projects/detail` | 查看项目详情 + 发送合伙请求 |
| 程序员广场 | `/pages/developers/index` | 浏览所有程序员 |
| 程序员详情 | `/pages/developers/detail` | 查看程序员详情 + 邀请合伙 |
| 我的请求 | `/pages/requests/index` | 管理收到/发出的合伙请求 |
| 个人中心 | `/pages/profile/index` | 查看/编辑个人信息 |

## 🚢 生产部署

1. 修改 `server/.env`：
   - `NODE_ENV=production`
   - 配置真实的 SMTP 邮件服务
   - 使用强 JWT 密钥

2. 构建前端：
   ```bash
   cd client && npm run build:h5
   ```

3. 构建后端：
   ```bash
   cd server && npm run build && npm run start:prod
   ```

## 📄 License

MIT
