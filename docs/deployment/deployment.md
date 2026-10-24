# China / US 原生部署与迁移

部署方式参考 FDE：首次安装与日常发布分离，按区域发布完整的前后端。使用独立 `cofounder` 系统用户、PM2、Nginx、PostgreSQL，不使用 Docker。

## 命令

```bash
cp .deploy.env.example .deploy.env
pnpm server:install us
pnpm server:deploy us
pnpm server:deploy us --check
pnpm server:deploy all
```

`all` 构建一次，按 China → US 顺序发布；前一目标失败立即停止。不再支持 `frontend` / `backend` 参数。旧脚本路径 `scripts/deploy.sh` 和 `scripts/init-server.sh` 分别转交区域发布与安装入口。

`.env` 先读取，`.deploy.env` 覆盖，配置通过 dotenv 解析，不当作 Shell 执行。私有部署配置不入 Git。每个目标可配置 `DEPLOY_<区域>_USE_PROXY`、`PROXY_HOST`、`PROXY_PORT`、`HTTP_PROXY_PORT`，代理只影响当前安装与发布。

安装器复用现有系统依赖；缺失时明确中止，不变更共享服务器的全局 Node/pnpm。端口由只读工具审计监听、Nginx、Supervisor、systemd 与 PM2 预留后选择，启动前再检查。首次安装只准备环境，不发布应用。首次安装建立维护文件，迁移项目应在完成迁移后开放；全新空库项目验收后可移除 `shared/maintenance`。

部署脚本在临时目录安装锁定依赖、更新风控词库、运行后端测试并构建前后端；只上传白名单运行产物，校验 SHA-256。服务器安装或复用 Linux 生产依赖，执行已编译 TypeORM 迁移，原子切换 `current`，启动服务并检查网页、API 与数据库业务请求。失败恢复旧代码；数据库迁移不自动撤销。只保留当前及上一个健康版本。历史 migration 不修改。

## 服务器布局

```text
/var/www/www.cofounder.icu/
  current -> releases/<版本>
  releases/<版本>/{server,client,scripts}
  shared/.env
  shared/region
  shared/installed
  shared/logs/
  shared/backups/<迁移编号>/
/var/lib/cofounder/  # 独立 pnpm、PM2 和系统服务 HOME
```

应用配置位于 `/var/www/www.cofounder.icu/shared/.env`，`server/.env` 是软链接。浏览器使用同源 `/api`，SSR 通过 `API_INTERNAL_URL=http://127.0.0.1:<API端口>/api` 访问本机后端。

## China → US 一次性迁移

针对本项目原有 China Supervisor 安装，US 必须是刚部署、保持维护状态的空业务库。已有 `migration-complete` 标记时拒绝再次迁移，避免覆盖新数据。旧 China 安装拒绝被区域部署脚本直接覆盖；迁移后应只部署 US。未来若需重新启用 China，需要单独迁移运行方式，不能直接执行 `all`。

```bash
pnpm server:install us
pnpm server:migrate prepare-env
pnpm server:deploy us
pnpm server:migrate china-to-us
```

`prepare-env` 仅允许 US 尚未发布时执行：备份 US 配置，复制 China 应用密钥、邮件等配置，保留 US 数据库凭据、端口与运行设置。命令不输出密钥。

正式迁移依次执行：

1. 检查 US 已健康发布且业务用户为空，备份两端配置。
2. China 返回维护响应，停止两端本项目服务。
3. 对 China 做 PostgreSQL 自定义格式完整备份，通过 SSH 传输并复核 SHA-256。
4. 在 US 新建独立数据库并恢复，保留 US 原数据库作为恢复点。
5. 对比全部 public 表行数、逐行内容摘要，以及序列当前值与调用状态；再执行 TypeORM 迁移并重新核验。
6. 切换 US `.env` 的数据库名，重启并验收。
7. China 代理到 US，兼容旧 DNS 缓存；开放 US，停止并禁用 China 旧服务自动启动。

备份目录包含 `china.dump`、US 的 `us-before.dump`、`env.before`、`verification.json`；China 还保留原 Nginx 和 Supervisor 配置。目录仅 root 可读，不入 Git。开放 US 之前失败会尝试恢复 China 服务和原配置；开放之后不自动回退旧库，避免丢失 US 新数据。涉及其他服务器或非本项目数据库时不得直接复用此迁移入口。

## 验收

```bash
pnpm test:deploy
pnpm server:deploy us --check
curl -f https://cofounder.icu/api/health
curl -f https://cofounder.icu/api/platform/cards
ssh deployer@170.106.81.213 'sudo systemctl is-active pm2-cofounder; sudo systemctl is-enabled pm2-cofounder'
```

`www.cofounder.icu` 若仍解析到 China，会继续由 China 的有效证书站点跳转到主域名。若将 www 也改到 US，应为 US 扩充包含 www 的证书与 Nginx server_name。

## 按区域卸载项目

卸载入口参考 zhenzhuo 项目的原生卸载脚本，兼容 China 旧 Supervisor 安装及 US 原生 PM2 安装。必须显式指定 `china` 或 `us`，不接受 `all`，不使用 `DEPLOY_TARGET` 默认值。

```bash
# 只读预览 China 的资源及删除范围
pnpm server:uninstall china

# 一键卸载 China，执行后自动逐项验收
pnpm server:uninstall china --execute --yes

# 此后可随时单独复查 China；存在残留则返回非零退出码
pnpm server:uninstall china --check
```

去掉 `--yes` 会要求输入 `cofounder/china` 确认。US 是独立目标，只有显式指定 `us --execute` 才会执行 US 删除。执行前只读比较两端 SSH 地址解析结果及 `/etc/machine-id`，阻止两个区域实际落在同一台机器；因此需要两端 SSH 可连接和现有 sudo 权限。上传和清理仅发生在选定服务器上。

删除范围包括项目发布目录、生产配置、日志、该服务器的迁移备份与临时发布包；本机专属 PostgreSQL 数据库与角色；Supervisor/PM2 自启配置；项目 Nginx 站点及已识别旧配置备份；项目独占 TLS 证书及续期配置。保留共享 Node、PostgreSQL、Nginx、Supervisor、deployer 账号和其它项目。共享证书或未知配置引用会报告待处理，不会宣称清理干净。

执行过程中显示核对、停止、删除、通过、待处理等详细信息，同时将输出保存到本机临时目录中的 `cofounder-uninstall-log-*/<区域>.log`。退出码 `0` 为预览完成或已知本机资源验收通过；`1` 为失败；`2` 为发现残留。清理失败时会尝试列出残留。验收包括文件、数据库与角色、服务自启、进程、历史应用端口、证书和额外配置引用。保留 `/var/log/cofounder-uninstall/<区域>.json` 非敏感记录及 `/run/lock/cofounder-uninstall.lock`，支持删除应用配置后复查及防止并发执行。

**当前 China 的 Nginx 仍为 US 提供转发和 www 跳转。卸载 China 将移除这些入口；请将仍指向 China 的 `www.cofounder.icu` DNS 迁至 US，并在 US 配置对应证书与站点。** DNS、外部平台配置、异机备份和未登记自定义路径不属于本机卸载范围。

本地验证：`pnpm test:uninstall`（临时文件系统与模拟服务，无真实删除），以及 `pnpm test:deploy`。
