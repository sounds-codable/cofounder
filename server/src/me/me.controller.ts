import { Body, Controller, Get, Headers, Put } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SaveBasicProfileDto } from './dto/save-basic-profile.dto';
import { SaveContactMethodsDto } from './dto/save-contact-methods.dto';
import { SaveDetailProfileDto } from './dto/save-detail-profile.dto';
import { SaveDisplayNameDto } from './dto/save-display-name.dto';
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

  @Put('contacts')
  async saveContacts(@Headers('authorization') authorization: string | undefined, @Body() body: SaveContactMethodsDto) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.saveContactMethods(user.id, body);
  }

  @Put('display-name')
  async saveDisplayName(@Headers('authorization') authorization: string | undefined, @Body() body: SaveDisplayNameDto) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.saveDisplayName(user.id, body);
  }
}
