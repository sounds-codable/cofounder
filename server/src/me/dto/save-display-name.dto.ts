import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SaveDisplayNameDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @IsOptional()
  @IsBoolean()
  riskConfirmed?: boolean;
}
