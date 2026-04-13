import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SendLoginCodeDto } from './dto/send-login-code.dto';
import { VerifyLoginCodeDto } from './dto/verify-login-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  sendCode(@Body() body: SendLoginCodeDto, @Req() req: Request) {
    return this.authService.sendLoginCode(body.email, body.inviteCode, this.resolveClientIp(req));
  }

  @Post('verify-code')
  verifyCode(@Body() body: VerifyLoginCodeDto, @Req() req: Request) {
    return this.authService.verifyLoginCode(body.email, body.code, this.resolveClientIp(req));
  }

  private resolveClientIp(req: Request) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const fromForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

    if (fromForwarded) {
      const first = fromForwarded.split(',')[0]?.trim();
      if (first) {
        return first;
      }
    }

    return req.ip || req.socket.remoteAddress || null;
  }
}
