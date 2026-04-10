import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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
  @MaxLength(200)
  headline!: string;

  @IsString()
  @MaxLength(2000)
  basicSummary!: string;

  @IsString()
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  desiredDirection?: string;

  @Transform(({ value }) => normalizeStrengths(value))
  @IsArray()
  @IsString({ each: true })
  strengths!: string[];

  @IsOptional()
  @IsBoolean()
  riskConfirmed?: boolean;
}
