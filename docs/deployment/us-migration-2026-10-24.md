# 2026-10-24 US 部署与数据迁移验收

项目已由 China 迁移到 US，主站为 https://cofounder.icu 。以下时间均为北京时间。

## 部署结果

- US：`deployer@170.106.81.213`。
- 命令：`pnpm server:install us`、`pnpm server:deploy us`。
- 当前版本：`/var/www/www.cofounder.icu/releases/20261024T050912Z-a3d580`，13:09 发布成功。
- Web / API：`127.0.0.1:3006`、`127.0.0.1:3007`。
- 专用用户：`cofounder`；PM2 HOME：`/var/lib/cofounder`。
- `pm2-cofounder` 为 active、enabled；保留当前及一个旧版本。
- 生产配置：`/var/www/www.cofounder.icu/shared/.env`。

## 数据结果

10:31 完成切换，China PostgreSQL 完整备份恢复到 US 的独立新库，再切换生产配置；两端原库均保留。

| 对象 | 迁移时数量 |
| --- | ---: |
| 用户 | 30 |
| 卡片 | 4 |
| 博客文章 | 2 |
| 详情申请 | 2 |
| public 表 | 15 |
| 序列 | 3 |

所有表行数、逐行内容摘要及序列状态在停止写入后、恢复后和运行迁移后校验一致。17 条历史 migration 已存在，没有待执行的新迁移，没有改写历史 migration。恢复后的审计日志会继续按原应用规则清理和增长。

两端备份目录：

`/var/www/www.cofounder.icu/shared/backups/20261024022927_0423f1`

US 内含 `china.dump`、`us-before.dump`、`env.before`、`verification.json`、`restored.json`；China 保留 `china.dump`、`source.json`、原环境文件、Nginx 与 Supervisor 配置。备份目录仅 root 可读。

China 导出文件 SHA-256：

`49f5ac1d5a97ecb3361811c6f3cc971073c1e1d90f56eebec0490f619eee0771`

## 实际验收

13:15 公网 CLI 验收通过：

- US HTTPS 首页、健康接口、4 张公开卡片和 2 篇文章。
- 使用原 China 签名密钥与已迁移用户身份生成短期测试令牌，访问 US 受保护资料接口成功。验证了令牌兼容与数据库读取；未发送登录邮件。
- 卡片分享短链接、带标题详情路径和动态站点地图通过部署健康检查；公网进一步验证分享页包含真实标题。
- 指定 China IP 请求卡片接口，与直接访问 US 的结果一致。
- China 旧前后端处于 STOPPED，`autostart=false`；Nginx 通过 HTTPS 转发到 US，保持上游证书校验，并使用校验深度 3。
- 主域名解析 US；`www.cofounder.icu` 仍解析 China，当前正常 301 跳转主域名。

本地证据：`/tmp/cofounder-final-verification.json`、`/tmp/cofounder-migrate-us.log`、`/tmp/cofounder-deploy-us-routes-final.log`。临时目录可能被系统清理，长期数据校验依据以服务器备份目录为准。

已修复独立构建引起的卡片静态/动态路由冲突，部署健康检查会在存在卡片时检查两种详情路径及站点地图。

## 日常更新

```bash
pnpm server:deploy us
```

`frontend / backend / all` 的组件选择方式已移除；现在 `all` 表示 China → US 两个区域。China 已退役且保留旧 Supervisor 安装，区域部署会拒绝覆盖该安装，所以当前应仅部署 US。若要重新使用 China，需要先单独完成运行环境迁移。
