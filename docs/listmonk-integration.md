# Listmonk 集成说明（Waitlist）

本文档说明 `cofounder` 项目中 waitlist 邮箱收集如何对接自建 Listmonk。

## 1. 当前接入范围

前端页面：
- `/`（映射到首页 waitlist）
- `/pages/index`
- `/pages/index6`

后端接口：
- `POST /api/waitlist/subscribe`

接口行为：
1. 前端提交邮箱到后端。
2. 后端校验并读取 `server/.env` 中 Listmonk 配置。
3. 后端先请求 `GET /api/lists/{LISTMONK_LIST_ID}` 校验目标列表存在。
4. 校验通过后调用 `POST /api/subscribers` 创建订阅（`preconfirm_subscriptions=false`）。
5. 创建成功后调用 `POST /api/subscribers/{subscriber_id}/optin` 发送确认邮件。
6. 若邮箱已存在（`409`），后端会先查询订阅者 ID，再调用 `PUT /api/subscribers/lists` 补加到目标列表，并重发确认邮件。

---

## 2. `.env` 配置项（server/.env）

在 `server/.env` 中新增或确认以下配置：

```env
# Listmonk (Waitlist)
LISTMONK_URL=http://127.0.0.1:9000
LISTMONK_API_USER=api_user
LISTMONK_API_TOKEN=your_api_token
LISTMONK_LIST_ID=1
```

字段说明：
- `LISTMONK_URL`：Listmonk 服务地址（不要带末尾 `/`，代码会自动兼容处理）。
- `LISTMONK_API_USER`：Listmonk API 用户名（默认可用 `api_user`）。
- `LISTMONK_API_TOKEN`：Listmonk API Token（不是管理员登录密码）。
- `LISTMONK_LIST_ID`：目标邮件列表 ID（正整数）。

> 注意：后端使用 `server/.env`（不是仓库根目录 `.env`）。

---

## 3. 在 Listmonk 中准备目标 List 与 Token

参考官方 API 文档：
- https://listmonk.app/docs/apis/lists/

建议流程：
1. 登录 Listmonk 管理台。
2. 创建或确认一个用于 waitlist 的 List。
3. 记录该 List 的 ID，填入 `LISTMONK_LIST_ID`。
4. 进入 `Admin -> Users`，打开用于 API 调用的用户（如 `api_user`）。
5. 在该用户页面生成 API Token（或重置并复制新 Token），填入 `LISTMONK_API_TOKEN`。
6. 确认后端机器可以访问 `LISTMONK_URL`。

后端请求头使用官方 token 格式：

```text
Authorization: token api_user:your_api_token
```

可用命令验证：

```bash
curl -H "Authorization: token api_user:your_api_token" http://127.0.0.1:9000/api/lists/1
```

若返回 200 且包含列表信息，说明列表可用。

---

## 4. 二次验证（Double opt-in）机制说明

结论（基于 Listmonk 官方文档）：
- 二次验证不是“输入验证码”。
- 是向用户邮箱发送一封确认邮件，用户点击邮件里的确认链接后，订阅才会从 `unconfirmed` 变成 `confirmed`。

相关文档：
- Concepts（List 的 opt-in 机制）：https://listmonk.app/docs/concepts/
- Subscribers API（发送 opt-in 邮件）：https://listmonk.app/docs/apis/subscribers/

当前项目实现：
1. 用户在页面输入邮箱并提交。
2. 后端把邮箱加入目标 list，订阅状态置为 `unconfirmed`。
3. 后端调用 `/api/subscribers/{id}/optin` 发送确认邮件。
4. 用户必须点击邮箱中的链接，才会正式确认订阅。

> 说明：你在 Listmonk 后台看到 `unconfirmed` 是正常现象，表示还没点击确认邮件链接。

---

## 5. 联调与自测

### 4.1 启动后端

```bash
pids=$(lsof -ti :3010); if [ -n "$pids" ]; then kill -9 $pids; fi
npm run start:dev
```

### 4.2 调用订阅接口

```bash
curl -X POST http://127.0.0.1:3010/api/waitlist/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test-listmonk@example.com"}'
```

成功时返回示例：

```json
{"success":true,"message":"订阅请求已提交，请查收确认邮件并点击链接完成订阅"}
```

如果邮箱已存在，返回：

```json
{"success":true,"message":"该邮箱已存在，已重新发送确认邮件，请点击邮箱链接完成订阅"}
```

### 4.3 验证是否已进入目标 list

```bash
curl -H "Authorization: token api_user:your_api_token" \
  "http://127.0.0.1:9000/api/subscribers?page=1&per_page=1&query=subscribers.email%20%3D%20'test-listmonk%40example.com'"
```

重点看返回中的：
- `lists[].id` 是否包含你的 `LISTMONK_LIST_ID`
- `lists[].subscription_status` 是否为 `unconfirmed` / `confirmed`

---

## 6. 常见问题排查

1. 返回“邮件列表配置不可用，请稍后重试”
- 检查 `LISTMONK_LIST_ID` 是否存在。
- 检查 `LISTMONK_API_USER` / `LISTMONK_API_TOKEN` 是否正确。
- 检查 `LISTMONK_URL` 是否可达。

2. 返回“服务配置错误，请联系管理员”
- `LISTMONK_LIST_ID` 不是正整数。

3. 页面提示成功，但在目标 list 看不到邮箱
- 常见原因是邮箱在 Listmonk 已存在，但未加入当前 `LISTMONK_LIST_ID`。
- 当前后端已处理该场景：会自动补加到目标 list 并重发确认邮件。
- 若仍异常，检查后端日志是否出现 `Listmonk list membership update failed`。

4. 开了 double opt-in 但没有看到“验证码输入”
- Listmonk 的 double opt-in 是“邮件确认链接”机制，不是验证码机制。
- 需检查 SMTP 配置、垃圾邮件箱、发件域名信誉等邮件送达链路。

5. 本地开发时想先不接 Listmonk
- 可暂时留空 Listmonk 配置，后端会记录日志并返回成功（用于前端联调）。

---

## 7. 发件人与确认邮件模板改造（你当前需求）

### 7.1 先说结论（基于官方文档）

1. **可以用 API 改发件人地址**（`app.from_email`）。
2. **确认邮件正文/按钮文案/页脚不是通过 Subscribers API 改**，而是通过 **System templates**（静态模板文件）改。
3. **System templates 是全局生效**（不是按发件人隔离）。若同一套 Listmonk 承载多个项目，建议在模板内按 `{{ .Lists }}` 做条件分支。
3. 你要去掉“私人列表”与“powered by listmonk”，需要修改模板：
   - `email-templates/subscriber-optin.html`
   - `email-templates/base.html`

官方依据：
- Settings API（Swagger）：`/api/settings`（GET/PUT）
- Templating / System templates：
  - https://listmonk.app/docs/templating/
  - https://listmonk.app/docs/configuration/
- 社区讨论（按 list 覆盖默认模板仍是需求项）：
  - https://github.com/knadh/listmonk/issues/2337

### 7.2 设置发件人（API 方式）

推荐发件人：

```text
Cofounder <info@info.cofounder.icu>
```

建议先读当前 settings，再基于原值更新：

```bash
# 1) 读取当前配置
curl -s -H "Authorization: token api_user:your_api_token" \
  http://127.0.0.1:9000/api/settings > temp/listmonk-settings.json

# 2) 修改 app.from_email（示例用 jq）
jq '.data["app.from_email"] = "Cofounder <info@info.cofounder.icu>" | .data' \
  temp/listmonk-settings.json > temp/listmonk-settings-updated.json

# 3) 回写配置
curl -X PUT -H "Authorization: token api_user:your_api_token" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:9000/api/settings \
  --data @temp/listmonk-settings-updated.json
```

如果返回 `permission denied: settings:get`：
- 说明当前 API 用户没有 settings 读写权限。
- 请在 Listmonk 后台给该用户补权限，或改用 Super Admin 的 API token 调 `GET/PUT /api/settings`。

如果你改了 token 权限后仍看到旧发件人（例如 `SDS <...>`），先直接核对 `app.from_email` 当前值：

```bash
curl -s -H "Authorization: token api_user:your_api_token" \
  http://127.0.0.1:9000/api/settings | jq -r '.data["app.from_email"]'
```

只要这里还是旧值，订阅确认邮件就会继续使用旧发件人。

### 7.3 设置确认邮件正文（模板方式）

本仓库已提供一套可直接使用的模板示例：
- `docs/listmonk-templates/subscriber-optin.html`
- `docs/listmonk-templates/base.html`

当前模板策略：
- `base.html` 页脚已改为空白。
- `subscriber-optin.html` 采用“按 list 条件分支”：仅 `ID=10`（Cofounder waitlist）使用定制文案，其它 list 走官方默认文案，避免影响同实例下其它项目。

你可以将它们覆盖到 Listmonk 的自定义静态目录（按官方 `--static-dir` 机制）。

示例流程：

```bash
# 以 /opt/listmonk/static 为例（按你的服务器实际路径调整）
mkdir -p /opt/listmonk/static/email-templates

# 拷贝模板
cp docs/listmonk-templates/subscriber-optin.html /opt/listmonk/static/email-templates/subscriber-optin.html
cp docs/listmonk-templates/base.html /opt/listmonk/static/email-templates/base.html

# 启动 listmonk 时指定 --static-dir
./listmonk --static-dir=/opt/listmonk/static
```

如果你用 Docker，需要把该目录挂载进容器，并在启动参数中带上 `--static-dir`。

### 7.4 Binary 部署（systemd）怎么改模板

如果你是二进制部署（不是 Docker），最常见是 `systemd` 托管。可按下面步骤做：

```bash
# 1) 找到 listmonk 服务名（常见是 listmonk）
systemctl list-units --type=service | grep -i listmonk

# 2) 查看当前启动命令（确认是否已带 --static-dir）
systemctl cat listmonk

# 3) 准备自定义静态目录
sudo mkdir -p /opt/listmonk/static/email-templates

# 4) 上传/覆盖模板（从本仓库 docs/listmonk-templates 复制）
sudo cp /path/to/cofounder/docs/listmonk-templates/subscriber-optin.html /opt/listmonk/static/email-templates/subscriber-optin.html
sudo cp /path/to/cofounder/docs/listmonk-templates/base.html /opt/listmonk/static/email-templates/base.html
```

然后给 `listmonk` 服务加 `--static-dir`。

如果你的 `ExecStart` 目前类似：

```text
ExecStart=/usr/local/bin/listmonk --config /etc/listmonk/config.toml
```

改为：

```text
ExecStart=/usr/local/bin/listmonk --config /etc/listmonk/config.toml --static-dir /opt/listmonk/static
```

应用变更并重启：

```bash
sudo systemctl daemon-reload
sudo systemctl restart listmonk
sudo systemctl status listmonk --no-pager
```

验证方式：
1. 用一个新邮箱触发一次 `POST /api/waitlist/subscribe`。
2. 收到邮件后检查：发件人是否为 `Cofounder <info@info.cofounder.icu>`、正文是否为自定义文案、页脚不再出现 powered by listmonk。
