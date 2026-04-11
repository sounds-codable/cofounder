import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBlogCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  parentCommentId?: string;

  @IsOptional()
  @IsBoolean()
  riskConfirmed?: boolean;
}
