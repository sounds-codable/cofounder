import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { IsEmail } from 'class-validator';

class SubscribeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;
}

@Controller('waitlist')
@UseGuards(JwtAuthGuard)
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('subscribe')
  @Public()
  async subscribe(@Body() dto: SubscribeDto) {
    return this.waitlistService.subscribe(dto.email);
  }
}
