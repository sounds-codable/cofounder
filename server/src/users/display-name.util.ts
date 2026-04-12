export const DISPLAY_NAME_MAX_LENGTH = 120;

const PREFERRED_DISPLAY_NAME_SUFFIXES = ['66', '666', '6666'] as const;

export function normalizeDisplayName(value: string) {
  return value.trim();
}

function buildDisplayNameWithSuffix(baseDisplayName: string, suffix = '') {
  const normalizedBaseDisplayName = normalizeDisplayName(baseDisplayName) || '新用户';
  const maxBaseLength = Math.max(DISPLAY_NAME_MAX_LENGTH - suffix.length, 1);
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
) {
  const directCandidate = buildDisplayNameWithSuffix(baseDisplayName);

  if (!(await isDisplayNameTaken(directCandidate))) {
    return directCandidate;
  }

  for (const suffix of iterateDisplayNameSuffixes()) {
    const candidate = buildDisplayNameWithSuffix(baseDisplayName, suffix);

    if (!(await isDisplayNameTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error('无法生成可用昵称');
}
