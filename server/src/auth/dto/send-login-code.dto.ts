import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendLoginCodeDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  inviteCode?: string;
}
