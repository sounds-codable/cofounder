import { Body, Controller, Get, Headers, Put } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SaveBasicProfileDto } from './dto/save-basic-profile.dto';
import { SaveDetailProfileDto } from './dto/save-detail-profile.dto';
import { MeService } from './me.service';

@Controller('me')
export class MeController {
  constructor(
    private readonly authService: AuthService,
    private readonly meService: MeService,
  ) {}

  @Get()
  async getProfile(@Headers('authorization') authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.getProfile(user.id);
  }

  @Put('basic')
  async saveBasic(@Headers('authorization') authorization: string | undefined, @Body() body: SaveBasicProfileDto) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.saveBasicProfile(user.id, body);
  }

  @Put('detail')
  async saveDetail(@Headers('authorization') authorization: string | undefined, @Body() body: SaveDetailProfileDto) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.saveDetailProfile(user.id, body);
  }
}
