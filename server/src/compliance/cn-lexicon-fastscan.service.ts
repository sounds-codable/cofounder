import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { RiskCategory, riskLexiconFiles } from '../config/content-moderation.config';

type LexiconMatch = [number, string];

type ScannerLike = {
  search: (normalizedText: string, options?: { longest?: boolean }) => LexiconMatch[];
};

type FastScannerCtor = new (terms: string[]) => ScannerLike;

@Injectable()
export class CnLexiconFastscanService implements OnModuleInit {
  private readonly logger = new Logger(CnLexiconFastscanService.name);
  private scanner: ScannerLike = { search: (normalizedText) => this.searchByTerms(normalizedText, true) };
  private readonly categoryByTerm = new Map<string, RiskCategory[]>();
  private normalizedTerms: string[] = [];
  private usingFastscan = false;
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

    this.normalizedTerms = normalizedTerms;
    await this.initializeScanner(normalizedTerms);
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
    return this.usingFastscan
      ? 'bad-words+fastscan+cn-sensitive-lexicon(local-txt)'
      : 'bad-words+cn-sensitive-lexicon(local-txt,naive-matcher)';
  }

  private async initializeScanner(terms: string[]) {
    try {
      const fastscanModule = (await import('fastscan')) as { default?: FastScannerCtor };
      const FastScanner = fastscanModule.default;

      if (!FastScanner) {
        throw new Error('FastScanner constructor missing');
      }

      this.scanner = new FastScanner(terms);
      this.usingFastscan = true;
    } catch (error) {
      this.usingFastscan = false;
      this.scanner = { search: (normalizedText, options) => this.searchByTerms(normalizedText, Boolean(options?.longest)) };
      this.logger.warn(`fastscan unavailable, fallback to naive matcher: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  private searchByTerms(normalizedText: string, longest: boolean): LexiconMatch[] {
    const matches: LexiconMatch[] = [];

    for (const term of this.normalizedTerms) {
      if (!term || term.length > normalizedText.length) {
        continue;
      }

      let fromIndex = 0;

      while (fromIndex < normalizedText.length) {
        const index = normalizedText.indexOf(term, fromIndex);

        if (index === -1) {
          break;
        }

        matches.push([index, term]);
        fromIndex = index + 1;
      }
    }

    if (!longest) {
      return matches.sort((a, b) => a[0] - b[0]);
    }

    const longestByIndex = new Map<number, string>();
    matches.forEach(([index, term]) => {
      const existing = longestByIndex.get(index);

      if (!existing || term.length > existing.length) {
        longestByIndex.set(index, term);
      }
    });

    return Array.from(longestByIndex.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([index, term]) => [index, term]);
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
