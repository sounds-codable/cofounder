import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SaveDetailProfileDto {
  @IsString()
  @MinLength(6)
  intro!: string;

  @IsString()
  @MinLength(4)
  education!: string;

  @IsString()
  @MinLength(6)
  experience!: string;

  @IsString()
  @MinLength(6)
  projectDetail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  wechat?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  qq?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  other?: string;
}
