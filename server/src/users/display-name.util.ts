export const DISPLAY_NAME_MAX_LENGTH = 120;
export const INVITE_CODE_MAX_LENGTH = 20;
export const SAFE_ACCOUNT_NAME_PATTERN = /^[A-Za-z0-9_]+$/;

const PREFERRED_DISPLAY_NAME_SUFFIXES = ['66', '666', '6666'] as const;

export function normalizeDisplayName(value: string) {
  return value.trim();
}

export function isSafeAccountName(value: string) {
  return SAFE_ACCOUNT_NAME_PATTERN.test(value);
}

export function sanitizeAccountNameForGeneration(value: string, fallbackValue = 'user') {
  const sanitized = normalizeDisplayName(value).replace(/[^A-Za-z0-9_]/g, '');
  return sanitized || fallbackValue;
}

function buildDisplayNameWithSuffix(baseDisplayName: string, suffix = '', maxLength = DISPLAY_NAME_MAX_LENGTH, fallbackValue = '新用户') {
  const normalizedBaseDisplayName = normalizeDisplayName(baseDisplayName) || fallbackValue;
  const maxBaseLength = Math.max(maxLength - suffix.length, 1);
  return `${normalizedBaseDisplayName.slice(0, maxBaseLength)}${suffix}`;
}

function* iterateDisplayNameSuffixes() {
  const visited = new Set<string>();

  for (const suffix of PREFERRED_DISPLAY_NAME_SUFFIXES) {
    visited.add(suffix);
    yield suffix;
  }

  let value = 1;

  while (true) {
    const suffix = String(value);
    value += 1;

    if (suffix.includes('4') || visited.has(suffix)) {
      continue;
    }

    visited.add(suffix);
    yield suffix;
  }
}

export async function resolveUniqueDisplayName(
  baseDisplayName: string,
  isDisplayNameTaken: (candidate: string) => Promise<boolean>,
  options?: {
    maxLength?: number;
    fallbackValue?: string;
    errorMessage?: string;
  },
) {
  const maxLength = options?.maxLength ?? DISPLAY_NAME_MAX_LENGTH;
  const fallbackValue = options?.fallbackValue ?? '新用户';
  const directCandidate = buildDisplayNameWithSuffix(baseDisplayName, '', maxLength, fallbackValue);

  if (!(await isDisplayNameTaken(directCandidate))) {
    return directCandidate;
  }

  for (const suffix of iterateDisplayNameSuffixes()) {
    const candidate = buildDisplayNameWithSuffix(baseDisplayName, suffix, maxLength, fallbackValue);

    if (!(await isDisplayNameTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error(options?.errorMessage || '无法生成可用昵称');
}
