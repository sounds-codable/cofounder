import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SaveDisplayNameDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[A-Za-z0-9_]+$/)
  displayName!: string;

  @IsOptional()
  @IsBoolean()
  riskConfirmed?: boolean;
}
