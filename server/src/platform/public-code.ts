import { UserRole } from '../common/enums/user-role.enum';

const publicCodeDigits = ['0', '1', '2', '3', '5', '6', '7', '8', '9'] as const;
const publicCodeLength = 5;
const publicCodeBase = publicCodeDigits.length;
const publicCodeCapacity = publicCodeBase ** publicCodeLength - 1;

export function getPublicCodePrefix(role: UserRole) {
  return role === UserRole.EXPERT ? 'p' : 'd';
}

export function formatPublicCodeNumber(sequenceNumber: number) {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber <= 0 || sequenceNumber > publicCodeCapacity) {
    throw new Error(`public code sequence out of range: ${sequenceNumber}`);
  }

  let value = sequenceNumber;
  const chars = Array.from({ length: publicCodeLength }, () => '0');

  for (let position = publicCodeLength - 1; position >= 0; position -= 1) {
    const digitIndex = value % publicCodeBase;
    chars[position] = publicCodeDigits[digitIndex] || '0';
    value = Math.floor(value / publicCodeBase);
  }

  return chars.join('');
}

export function buildCardPublicCode(role: UserRole, sequenceNumber: number) {
  return `${getPublicCodePrefix(role)}-${formatPublicCodeNumber(sequenceNumber)}`;
}
