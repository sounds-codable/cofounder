import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendLoginCodeDto } from './dto/send-login-code.dto';
import { VerifyLoginCodeDto } from './dto/verify-login-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  sendCode(@Body() body: SendLoginCodeDto) {
    return this.authService.sendLoginCode(body.email, body.inviteCode);
  }

  @Post('verify-code')
  verifyCode(@Body() body: VerifyLoginCodeDto) {
    return this.authService.verifyLoginCode(body.email, body.code);
  }
}
