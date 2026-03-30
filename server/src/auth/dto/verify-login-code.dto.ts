import { IsEmail, Length, Matches } from 'class-validator';

export class VerifyLoginCodeDto {
  @IsEmail()
  email!: string;

  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
