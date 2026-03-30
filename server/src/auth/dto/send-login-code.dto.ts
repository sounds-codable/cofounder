import { IsEmail } from 'class-validator';

export class SendLoginCodeDto {
  @IsEmail()
  email!: string;
}
