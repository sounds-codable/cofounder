import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class RejectDetailRequestDto {
  @IsString()
  @MinLength(2)
  reason!: string;

  @IsOptional()
  @IsBoolean()
  riskConfirmed?: boolean;
}
