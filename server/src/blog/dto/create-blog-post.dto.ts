import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @MinLength(2)
  @MaxLength(220)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(400)
  summary!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(50000)
  contentMarkdown!: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsBoolean()
  riskConfirmed?: boolean;
}
