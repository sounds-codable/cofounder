import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePublicWelfareMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  contact!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  message!: string;
}
