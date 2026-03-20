# Listmonk 配置指南

合伙造使用 [Listmonk](https://listmonk.app/) 管理 Waitlist 邮件订阅。

当前接入了以下 waitlist 页面：
- `/pages/index`（简版欢迎页）
- `/pages/index4`（I See You 版，顶部 + 底部双输入框）
- `/pages/index7`（基于 `index2` 风格的新 I See You 版，顶部 + 底部双输入框）

以上页面都调用同一个后端接口：`POST /api/waitlist/subscribe`

如果你想本地查看新页面，可直接访问：

```text
http://localhost:10086/pages/index7
```

## 1. 安装 Listmonk

### 方式 A：Docker（推荐）

```bash
# 创建目录
mkdir listmonk && cd listmonk

# 下载 docker-compose
curl -LO https://raw.githubusercontent.com/knadh/listmonk/master/docker-compose.yml

# 启动
docker compose up -d

# 首次运行：初始化数据库
docker compose run --rm app ./listmonk --install
```

启动后访问 http://localhost:9000，默认账号密码：`admin` / `listmonk`。

### 方式 B：二进制

从 [GitHub Releases](https://github.com/knadh/listmonk/releases) 下载对应平台的二进制文件，运行 `./listmonk --install` 初始化，再 `./listmonk` 启动。

## 2. 配置 Listmonk

1. 登录 http://localhost:9000
2. 修改管理员密码（Settings → General）
3. 创建一个 List：
   - 进入 **Lists** → **Create new**
   - Name: `合伙造 Waitlist`
   - Type: `Public`
   - Optin: `Single opt-in`（建议 waitlist 用单次确认）
   - 记下创建后的 **List ID**（通常第一个是 `1`）

4. 配置发件邮箱（Settings → SMTP）：
   - Host: 你的 SMTP 服务器（如 `smtp.qq.com`）
   - Port: `465`
   - Auth: `login`
   - Username / Password: 你的邮箱账号密码
   - TLS: `SSL/TLS`

## 3. 配置 server/.env

在 `server/.env` 中填入你的 Listmonk 信息：

```env
# Listmonk 配置
LISTMONK_URL=http://localhost:9000    # Listmonk 地址
LISTMONK_ADMIN_USER=admin             # 管理员用户名
LISTMONK_ADMIN_PASS=your_password     # 管理员密码
LISTMONK_LIST_ID=1                    # Waitlist 的 List ID
```

这组配置会同时服务于 `/pages/index`、`/pages/index4`、`/pages/index7` 的邮箱订阅表单。

### 配置检查清单（最重要）

1. `LISTMONK_URL` 可从后端机器访问（例如 `http://127.0.0.1:9000`）。  
2. `LISTMONK_ADMIN_USER` / `LISTMONK_ADMIN_PASS` 与后台登录一致。  
3. `LISTMONK_LIST_ID` 是你在 Listmonk 中创建的目标列表 ID。  
4. 修改 `.env` 后，重启后端服务（`npm run start:dev` 或 `npm run start:prod`）。  

**生产环境部署时：**
- 将 `LISTMONK_URL` 改为你的公网 Listmonk 地址
- 设置强密码
- 如果 Listmonk 和后端在同一服务器，可用 `http://127.0.0.1:9000`

## 4. 工作原理

```
用户在首页输入邮箱
      ↓
前端调用 POST /api/waitlist/subscribe
      ↓
后端通过 Listmonk API 添加订阅者到指定 List
      ↓
Listmonk 管理后续的邮件发送
```

- 后端 API 是公开的（无需登录即可调用）
- 如果 Listmonk 未配置，后端会正常返回成功并在日志中记录邮箱（方便开发调试）
- 重复订阅会返回"该邮箱已订阅"

## 5. 发送通知邮件

产品上线后：

1. 进入 Listmonk 后台 → **Campaigns** → **Create new**
2. 选择 `合伙造 Waitlist` 作为收件人列表
3. 编写上线通知邮件内容
4. 发送

## 6. 验证配置是否正确

```bash
# 测试 Listmonk API 连通性
curl -u admin:your_password http://localhost:9000/api/lists

# 测试订阅接口
curl -X POST http://localhost:3000/api/waitlist/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```
