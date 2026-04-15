# 部署说明（Ubuntu 24.04 + Nginx + Supervisor + PostgreSQL）

本文档用于将本项目（前端 Next.js v16 动态服务 + 后端 NestJS v11）部署到你自己的 Ubuntu 24.04 服务器。

- 服务器代码目录：`/var/www/www.cofounder.icu`
- 进程管理：Supervisor（前端 + 后端）
- Web Server：Nginx（反向代理到前端 3000 与后端 3010）

## 0. 约定的目录结构（推荐）

建议把“代码仓库”和“运行时产物”分开，避免每次发布污染工作区，且便于回滚。

在服务器上使用如下结构：

- `/var/www/www.cofounder.icu/repo`
  - 通过 `git clone` 得到的仓库
  - 包含新的 `client/` 与 `server/`
  - 仓库中也可能包含 `archive/`，用于保留旧版 Taro / 旧版服务代码
- `/var/www/www.cofounder.icu/releases`
  - 每次发布一个独立目录（可选，如果你不做回滚，也可以只用 `current`）
- `/var/www/www.cofounder.icu/current`
  - 指向当前运行版本（软链接，推荐）
- `/var/www/www.cofounder.icu/shared`
  - 跨版本共享的数据
  - 例如：后端 `.env`、日志目录等

如果你希望简单一些（不做多版本回滚），也可以只用：

- `/var/www/www.cofounder.icu/app`（放 repo）
- `/var/www/www.cofounder.icu/www`（放前端 dist）

本文档后续以“推荐结构”为准。

## 1. 首次部署：系统依赖

在 Ubuntu 24.04 上安装：

- Node.js（建议 18 或 20；项目本地要求 `>=18`）
- npm（随 Node.js）
- Nginx
- Supervisor
- PostgreSQL 客户端工具（用于建库/建用户、检查连接）

建议使用 `nvm` 或发行版 NodeSource 安装 Node.js。

## 2. 首次部署：创建 Linux 用户与目录

建议使用专用用户运行服务（例如 `cofounder`），并赋予 `/var/www/www.cofounder.icu` 的权限。

目录初始化（参考）：

- `/var/www/www.cofounder.icu/repo`
- `/var/www/www.cofounder.icu/shared/server`
- `/var/www/www.cofounder.icu/shared/logs`
- `/var/www/www.cofounder.icu/current`（后续由 deploy 脚本维护）

## 3. 首次部署：PostgreSQL 建库与用户

你服务器上已有 PostgreSQL + PgBouncer 使用经验（你给的示例是 `PG_DSN` 指向 `127.0.0.1:6432`）。

但本项目后端当前使用的是 TypeORM，并且读取的环境变量是：

- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`

因此，生产上你需要：

1. 在 PostgreSQL 中创建数据库（服务器端数据库名称继续保持原名，例如 `cofounder`）
2. 创建用户（例如 `cofounder`）并授权
3. 在后端 `.env` 中配置上述 `DB_*`

### 3.1 建议的 SQL（示例）

在服务器上用 `psql` 以管理员身份执行（根据你现有 PG 管理方式调整）：
sudo -u postgres psql

- 创建用户：`CREATE USER cofounder WITH PASSWORD '强密码';`
- 创建库：`
CREATE DATABASE cofounder
WITH OWNER = cofounder
ENCODING = 'UTF8'
LC_COLLATE = 'en_US.UTF-8'
LC_CTYPE = 'en_US.UTF-8'
TEMPLATE = template0;
`
- 额外授权（可选）：`GRANT ALL PRIVILEGES ON DATABASE cofounder TO cofounder;`

好了后，试一下：
psql -U cofounder -d cofounder

如果你通过 PgBouncer 连接，通常：

- `DB_HOST=127.0.0.1`
- `DB_PORT=6432`

### 3.2 PgBouncer（推荐）：为 cofounder 配置数据库映射与认证

如果你在后端 `.env` 里配置 `DB_PORT=6432`，则**必须**保证 PgBouncer 能识别：

- 数据库映射（`[databases]` 里存在 `cofounder = ... dbname=cofounder`）
- 用户认证（`auth_type` 与 `auth_file` / `auth_query` 能为用户 `cofounder` 提供正确密码）

否则后端启动会报：`SASL authentication failed`，进程退出后被 Supervisor 自动拉起，表现为服务不停重启、Nginx 返回 502。

#### 3.2.1 查看 PgBouncer 配置与日志

- 查看服务状态（能看到配置文件路径）：

  `systemctl status pgbouncer --no-pager`

  典型输出会包含类似：`/usr/sbin/pgbouncer /etc/pgbouncer/pgbouncer.ini`

- 查看日志（systemd/journald）：

  `sudo journalctl -u pgbouncer --since "30 min ago" --no-pager`

#### 3.2.2 配置 databases 映射（必须包含 cofounder）

编辑 `/etc/pgbouncer/pgbouncer.ini` 的 `[databases]` 段，加入：

`cofounder = host=127.0.0.1 port=5432 dbname=cofounder`

说明：左侧 `cofounder` 是客户端连接时使用的逻辑库名（你在 `psql ... dbname=cofounder`、以及后端 `.env` 的 `DB_DATABASE=cofounder`）。

你也可以使用通配映射（适合“所有库都走同一个本地 PostgreSQL”）：

`* = host=127.0.0.1 port=5432`

注意：

1. 通配映射会让 PgBouncer 接受任意 `dbname`，减少手工维护，但不利于对不同库做差异化参数控制。
2. 即使使用通配映射，用户认证仍然需要 `auth_file` 或 `auth_query` 能识别对应用户名。
3. 同一台服务器上混用“部分项目直连 PostgreSQL、部分项目走 PgBouncer”是可行的；但要确保：
   - 直连项目使用 `5432`（或你的 PG 真实端口）
   - 走池化的项目使用 `6432`
   - PgBouncer 的 `pool_mode=transaction` 对会话特性有限制（临时表、会话级 prepare、部分驱动的 session 依赖），不适合的项目应直连。

#### 3.2.3 两种认证配置方式（二选一）

PgBouncer 的 `auth_type = scram-sha-256` 要求 PgBouncer 能拿到用户的 SCRAM secret。

常见做法有两种：

##### 方式 A：使用 auth_file（userlist.txt）

适用于：你希望 PgBouncer 只依赖本地文件，不从数据库查询密码。

`/etc/pgbouncer/pgbouncer.ini`（示例）：

- `auth_type = scram-sha-256`
- `auth_file = /etc/pgbouncer/userlist.txt`

然后在 `/etc/pgbouncer/userlist.txt` 中加入用户：

`"cofounder" "SCRAM-SHA-256$..."`

注意：如果 userlist 里没有 `cofounder`，日志会出现 `no such user: cofounder`，并最终 `SASL authentication failed`。

##### 方式 B：使用 auth_query（推荐，省去手工生成 userlist）

适用于：你希望 PgBouncer 从 PostgreSQL 里查询用户密码（SCRAM secret），避免手工维护 userlist。

思路是：创建一个专用账号（例如 `pgbouncer`），让它可以读取系统表里用户的密码字段，并在 PgBouncer 里配置：

- `auth_type = scram-sha-256`
- `auth_user = pgbouncer`
- `auth_query = SELECT usename, passwd FROM pg_shadow WHERE usename=$1`

这种方式下，客户端用户（如 `cofounder`）的密码变更后，PgBouncer 无需同步 userlist。

落地步骤（示例，按你的安全策略调整）：

1. 在 PostgreSQL 创建一个专用于 PgBouncer 认证查询的账号（例如 `pgbouncer`）：

   `CREATE USER pgbouncer WITH PASSWORD '强密码';`

2. 允许该账号读取用户密码哈希（SCRAM secret）。常见做法是读取系统视图 `pg_shadow`（需要管理员/超级用户权限）或使用等价方式授权。

3. 修改 `/etc/pgbouncer/pgbouncer.ini`：

   - `auth_type = scram-sha-256`
   - `auth_user = pgbouncer`
   - `auth_query = SELECT usename, passwd FROM pg_shadow WHERE usename=$1`

4. `auth_file` 仍可保留，用于管理用户（例如 `pgbouncer` / `postgres`）本地登录；业务用户（如 `cofounder`）可不必写入 userlist。

5. 重载或重启 PgBouncer 后验证：

   `sudo systemctl reload pgbouncer || sudo systemctl restart pgbouncer`

   `psql "host=127.0.0.1 port=6432 user=cofounder dbname=cofounder"`

提示：`pg_shadow` 需要足够权限才能读到 `passwd`，该方式需要你按 PostgreSQL 的安全策略授权；具体 SQL 以你的 PG 版本与安全要求为准。

#### 3.2.4 如何生成/获取 cofounder 的 SCRAM-SHA-256 secret

仅当你选择“方式 A：auth_file (userlist.txt)”时需要。

方法 1（推荐）：从 PostgreSQL 直接导出该用户的 SCRAM secret

- 确保该用户密码是 SCRAM：
sudo -u postgres psql

  `SHOW password_encryption;`

  通常应为 `scram-sha-256`。如果不是，先把 `password_encryption` 调整为 `scram-sha-256` 后再 `ALTER ROLE` 重设一次密码。

- 获取用户的密码字段（需要管理员权限）：

  `SELECT rolname, rolpassword FROM pg_authid WHERE rolname = 'cofounder';`

输出里的 `rolpassword` 如果是 `SCRAM-SHA-256$...`，就把它填进 `/etc/pgbouncer/userlist.txt`：

`"cofounder" "SCRAM-SHA-256$..."`

方法 2：不要生成 userlist，直接改用 `auth_query`

如上“方式 B”，避免维护 userlist。

#### 3.2.5 让配置生效（reload/restart）

修改完 `/etc/pgbouncer/pgbouncer.ini` 或 `/etc/pgbouncer/userlist.txt` 后：

- 重载配置：`sudo systemctl reload pgbouncer`
- 若 reload 不生效或不支持：`sudo systemctl restart pgbouncer`

#### 3.2.6 验证 PgBouncer 连接（必须成功）

先验证直连 PG：

`psql "host=127.0.0.1 port=5432 user=cofounder dbname=cofounder"`

再验证走 PgBouncer：

`psql "host=127.0.0.1 port=6432 user=cofounder dbname=cofounder"`

当 6432 连接成功后，后端服务才能稳定运行（不再十几秒重启），前端 `/api/*` 502 会消失。

## 4. 首次部署：后端环境变量（server/.env）

后端会读取仓库 `server/.env`（NestJS ConfigModule 指定 `envFilePath: '.env'`），建议把生产 `.env` 放在 `shared`，再软链接到当前版本目录。

至少需要配置：

.env 配置如下：

# === 应用配置 ===
NODE_ENV=production
PORT=3010

# === 数据库连接 ===
DB_HOST=127.0.0.1
DB_PORT=6432
DB_USERNAME=cofounder
DB_PASSWORD=pass # 改一下
DB_DATABASE=cofounder
DB_LOGGING=false
TYPEORM_SYNCHRONIZE=false

# === JWT 配置 ===
JWT_SECRET=replace_with_real_secret
JWT_EXPIRES_IN=7d

# === SMTP 配置 ===
MAIL_HOST=smtp.example.com
MAIL_PORT=465
MAIL_USER=hello@example.com
MAIL_PASS=pass # 改一下
MAIL_FROM="叩饭（Cofounder） <hello@example.com>"

## 5. 首次部署：构建与运行

### 5.1 后端（NestJS）

后端生产启动方式是：
cd server
- 构建：`npm run build`
- 运行：`npm run start:prod`（本质是 `node dist/main`）

### 5.2 前端（Next.js v16 动态服务）

前端构建命令：

- `npm run build`

前端生产启动命令：

- `npm run start -- --port 3000`

说明：线上由 Next.js Node 进程直接处理应用路由（如 `/p00003/{slug}`），页面会按应用逻辑读取 DB 数据；不再依赖 `client/dist` 静态托管。

## 6. Nginx 与 Supervisor 配置

- Nginx 配置文件：见 `docs/deployment/nginx.cofounder.icu.conf`
- Supervisor 后端配置：见 `docs/deployment/supervisor.cofounder-backend.conf`
- Supervisor 前端配置：见 `docs/deployment/supervisor.cofounder-frontend.conf`

## 7. 后续每次部署（发布流程）

推荐使用仓库内的 `scripts/deploy.sh`：

- 仅前端：`./scripts/deploy.sh frontend`
- 仅后端：`./scripts/deploy.sh backend`
- 全部：`./scripts/deploy.sh all`

脚本会完成：

- 拉取最新代码（你可以按需固定分支/commit）
- 在服务器端构建前端 release（`npm ci` + `npm run build`）
- 安装并构建后端（后端仍是本地构建后上传 dist）
- 更新 `current` 指向
- 重启 supervisor 管理的前端与后端进程

（脚本细节以你实际落地为准，见后续脚本文件。）
