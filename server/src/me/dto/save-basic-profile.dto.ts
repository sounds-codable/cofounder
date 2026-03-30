import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

function normalizeStrengths(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    return value
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export class SaveBasicProfileDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(200)
  headline!: string;

  @IsString()
  @MinLength(6)
  basicSummary!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  desiredDirection?: string;

  @Transform(({ value }) => normalizeStrengths(value))
  @IsArray()
  @IsString({ each: true })
  strengths!: string[];
}
