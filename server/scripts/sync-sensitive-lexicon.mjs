import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const requestTimeoutMs = Number(process.env.MODERATION_SYNC_TIMEOUT_MS || 12000);

const sources = [
  {
    category: 'pornography',
    remoteUrls: [
      'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/色情词库.txt',
      'https://cdn.jsdelivr.net/gh/konsheng/Sensitive-lexicon@main/Vocabulary/色情词库.txt',
    ],
    targetRelativePath: 'src/config/content-moderation-lexicon/upstream/pornography.txt',
  },
  {
    category: 'politics',
    remoteUrls: [
      'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/政治类型.txt',
      'https://cdn.jsdelivr.net/gh/konsheng/Sensitive-lexicon@main/Vocabulary/政治类型.txt',
    ],
    targetRelativePath: 'src/config/content-moderation-lexicon/upstream/politics.txt',
  },
  {
    category: 'violence',
    remoteUrls: [
      'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/暴恐词库.txt',
      'https://cdn.jsdelivr.net/gh/konsheng/Sensitive-lexicon@main/Vocabulary/暴恐词库.txt',
    ],
    targetRelativePath: 'src/config/content-moderation-lexicon/upstream/violence.txt',
  },
  {
    category: 'fraud',
    remoteUrls: [
      'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/广告类型.txt',
      'https://cdn.jsdelivr.net/gh/konsheng/Sensitive-lexicon@main/Vocabulary/广告类型.txt',
    ],
    targetRelativePath: 'src/config/content-moderation-lexicon/upstream/fraud.txt',
  },
  {
    category: 'illegal_goods',
    remoteUrls: [
      'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/Vocabulary/涉枪涉爆.txt',
      'https://cdn.jsdelivr.net/gh/konsheng/Sensitive-lexicon@main/Vocabulary/涉枪涉爆.txt',
    ],
    targetRelativePath: 'src/config/content-moderation-lexicon/upstream/illegal_goods.txt',
  },
];

const normalizeContent = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  return `${Array.from(new Set(lines)).join('\n')}\n`;
};

const fetchTextWithFallback = async (source) => {
  const errors = [];

  for (const remoteUrl of source.remoteUrls) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const response = await fetch(remoteUrl, {
        headers: {
          'user-agent': 'cofounder-content-moderation-sync',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        errors.push(`${remoteUrl} -> HTTP ${response.status} ${response.statusText}`);
        continue;
      }

      const text = await response.text();
      return { text, remoteUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const cause = error instanceof Error && error.cause ? ` | cause: ${String(error.cause)}` : '';
      errors.push(`${remoteUrl} -> ${message}${cause}`);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`[${source.category}] 所有下载地址均失败: ${errors.join(' ; ')}`);
};

const sync = async () => {
  let successCount = 0;
  let fallbackCount = 0;

  for (const source of sources) {
    const targetFile = resolve(projectRoot, source.targetRelativePath);

    try {
      const { text: raw, remoteUrl } = await fetchTextWithFallback(source);
      const normalized = normalizeContent(raw);

      await mkdir(dirname(targetFile), { recursive: true });
      await writeFile(targetFile, normalized, 'utf8');

      successCount += 1;
      console.log(`已同步 ${source.category} (${remoteUrl}) -> ${source.targetRelativePath}`);
    } catch (error) {
      if (existsSync(targetFile)) {
        fallbackCount += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`警告: ${source.category} 下载失败，已保留本地旧词表 ${source.targetRelativePath}。原因: ${message}`);
        continue;
      }

      throw error;
    }
  }

  console.log(`同步完成，更新 ${successCount} 个词库文件，离线兜底 ${fallbackCount} 个。`);
};

sync().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`同步失败: ${message}`);
  process.exit(1);
});
