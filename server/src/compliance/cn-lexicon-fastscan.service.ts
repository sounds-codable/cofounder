import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import FastScanner from 'fastscan';
import { RiskCategory, riskLexiconFiles } from '../config/content-moderation.config';

type LexiconMatch = [number, string];

@Injectable()
export class CnLexiconFastscanService implements OnModuleInit {
  private readonly logger = new Logger(CnLexiconFastscanService.name);
  private scanner = new FastScanner([]);
  private readonly categoryByTerm = new Map<string, RiskCategory[]>();
  private loadedTermCount = 0;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.reload();
  }

  async reload() {
    const nextCategoryByTerm = new Map<string, RiskCategory[]>();

    for (const descriptor of riskLexiconFiles) {
      const terms = await this.readTermsFromLexiconFile(descriptor.relativePath);

      terms.forEach((term) => {
        const categories = nextCategoryByTerm.get(term) ?? [];

        if (!categories.includes(descriptor.category)) {
          nextCategoryByTerm.set(term, [...categories, descriptor.category]);
        }
      });
    }

    const normalizedTerms = Array.from(nextCategoryByTerm.keys());

    this.scanner = new FastScanner(normalizedTerms);
    this.categoryByTerm.clear();
    nextCategoryByTerm.forEach((categories, term) => {
      this.categoryByTerm.set(term, categories);
    });
    this.loadedTermCount = normalizedTerms.length;

    this.logger.log(`Loaded moderation lexicon terms: ${this.loadedTermCount}`);
  }

  search(normalizedText: string): LexiconMatch[] {
    return this.scanner.search(normalizedText, { longest: true });
  }

  getCategoriesByTerm(term: string) {
    return this.categoryByTerm.get(term) ?? [];
  }

  getProviderLabel() {
    return 'bad-words+fastscan+cn-sensitive-lexicon(local-txt)';
  }

  private async readTermsFromLexiconFile(relativePath: string) {
    const fullPath = this.resolveLexiconPath(relativePath);

    if (!existsSync(fullPath)) {
      this.logger.warn(`Lexicon file not found: ${fullPath}`);
      return [];
    }

    const text = await readFile(fullPath, 'utf8');

    return Array.from(
      new Set(
        text
          .split(/\r?\n/)
          .map((line) => line.trim().toLowerCase())
          .filter((line) => line.length > 0 && !line.startsWith('#')),
      ),
    );
  }

  private resolveLexiconPath(relativePath: string) {
    const configuredDir = this.configService.get<string>('CONTENT_MODERATION_LEXICON_DIR')?.trim();

    if (configuredDir) {
      return resolve(configuredDir, relativePath.split('/').slice(1).join('/'));
    }

    const configBaseCandidates = [resolve(__dirname, '../config'), resolve(process.cwd(), 'src/config'), resolve(process.cwd(), 'dist/config')];
    const candidate = configBaseCandidates.find((basePath) => existsSync(basePath));

    return resolve(candidate ?? resolve(__dirname, '../config'), relativePath);
  }
}
