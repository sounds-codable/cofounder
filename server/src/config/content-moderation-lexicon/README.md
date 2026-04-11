# 内容风控词库说明（fastscan + Sensitive-lexicon）

本目录用于维护后端违规词词库，供 `ContentModerationService` 使用。

- 算法引擎：`fastscan`
- 词库来源：
  - `manual/`：项目手工维护词
  - `upstream/`：从 `konsheng/Sensitive-lexicon` 同步得到的上游词

## 目录结构

```text
content-moderation-lexicon/
├── manual/
│   ├── abuse.txt
│   ├── fraud.txt
│   ├── illegal_goods.txt
│   ├── politics.txt
│   ├── pornography.txt
│   └── violence.txt
└── upstream/
    ├── fraud.txt
    ├── illegal_goods.txt
    ├── politics.txt
    ├── pornography.txt
    └── violence.txt
```

## 手动维护词（运营常用）

直接编辑 `manual/*.txt`。

规则：
- 一行一个词
- 空行会被忽略
- 以 `#` 开头的行会被当做注释
- 建议使用 UTF-8 编码

示例：

```text
刷单
洗钱
# 这是注释
骗贷
```

## 更新上游词库（Sensitive-lexicon）

请先进入 `server` 目录，再执行同步命令：

```bash
cd server
npm run moderation:sync-lexicon
```

说明：
- 脚本会优先访问 `raw.githubusercontent.com`，失败后自动回退到 `cdn.jsdelivr.net`
- 如果网络异常且本地已有旧版 `upstream/*.txt`，会自动保留旧文件并给出告警（离线兜底）

## 生效时机

- 词库在后端启动时加载到内存（高性能）
- 修改 `txt` 后，当前默认需要重启后端服务生效
- 若后续接入管理员“词库热重载”接口，可实现不重启生效

## 相关文件

- `server/src/config/content-moderation.config.ts`
- `server/src/compliance/cn-lexicon-fastscan.service.ts`
- `server/scripts/sync-sensitive-lexicon.mjs`
