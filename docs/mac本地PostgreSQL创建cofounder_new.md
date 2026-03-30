# mac 本地创建 PostgreSQL 数据库 `cofounder_new`

本文档用于在本地 mac 开发环境中创建新的数据库：

- 数据库名：`cofounder_new`

新的 NestJS 后端默认会从 `server/.env` 读取这个数据库名。

## 1. 前提

你需要本地已经安装并启动 PostgreSQL。

可先检查：

```bash
psql --version
```

如果你使用 Homebrew 安装 PostgreSQL，也可以检查服务状态：

```bash
brew services list | grep postgresql
```

## 2. 进入 PostgreSQL

如果本地当前用户可以直接登录：

```bash
psql postgres
```

如果你需要指定用户：

```bash
psql -U postgres postgres
```

## 3. 创建数据库

进入 `psql` 后执行：

```sql
CREATE DATABASE cofounder_new;
```

如果你希望显式指定 owner，也可以这样：

```sql
CREATE DATABASE cofounder_new OWNER postgres;
```

## 4. 验证数据库是否创建成功

在 `psql` 中执行：

```sql
\l
```

或者退出后执行：

```bash
psql -d cofounder_new -c '\dt'
```

如果能正常连接，就说明数据库已创建成功。

## 5. 配置后端环境变量

复制新的后端环境变量模板：

```bash
cp server/.env.example server/.env
```

然后确保 `server/.env` 里至少包含：

```env
PORT=3010
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=cofounder_new
TYPEORM_SYNCHRONIZE=true
```

请根据你的本地 PostgreSQL 实际用户名、密码做修改。

## 6. 启动新的 NestJS 后端

```bash
npm install --prefix server
npm run start:dev --prefix server
```

如果连接成功，服务会在：

- `http://localhost:3010`

启动。

## 7. 服务器数据库处理说明

本地开发使用的是：

- `cofounder_new`

但服务器端按你的要求：

- **数据库名称保持原名不变**
- **清空原有数据库中的历史数据**

这一步属于部署 / 运维动作，不在本地自动执行。建议在正式上线前，单独按生产环境 PostgreSQL 权限执行清库或重建表结构。
