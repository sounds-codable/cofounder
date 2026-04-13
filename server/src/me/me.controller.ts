import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SaveBasicProfileDto } from './dto/save-basic-profile.dto';
import { SaveContactMethodsDto } from './dto/save-contact-methods.dto';
import { UpdateCardBasicDto } from './dto/update-card-basic.dto';
import { SaveDetailProfileDto } from './dto/save-detail-profile.dto';
import { SaveDisplayNameDto } from './dto/save-display-name.dto';
import { ToggleCardEngagementDto } from './dto/toggle-card-engagement.dto';
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

  @Put('card/:cardId')
  async updateCardBasic(
    @Headers('authorization') authorization: string | undefined,
    @Param('cardId') cardId: string,
    @Body() body: UpdateCardBasicDto,
  ) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.updateCardBasic(user.id, cardId, body);
  }

  @Delete('card/:cardId')
  async deleteCard(@Headers('authorization') authorization: string | undefined, @Param('cardId') cardId: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.deleteCard(user.id, cardId);
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

  @Get('display-name-availability')
  async getDisplayNameAvailability(
    @Headers('authorization') authorization: string | undefined,
    @Query('displayName') displayName?: string,
  ) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.getDisplayNameAvailability(user.id, displayName || '');
  }

  @Put('invite-code')
  async saveInviteCode(@Headers('authorization') authorization: string | undefined, @Body() body: SaveDisplayNameDto) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.saveInviteCode(user.id, {
      inviteCode: body.displayName,
      riskConfirmed: body.riskConfirmed,
    });
  }

  @Get('invite-code-availability')
  async getInviteCodeAvailability(
    @Headers('authorization') authorization: string | undefined,
    @Query('inviteCode') inviteCode?: string,
  ) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.getInviteCodeAvailability(user.id, inviteCode || '');
  }

  @Get('invites')
  async getInvites(@Headers('authorization') authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.getInviteOverview(user.id);
  }

  @Get('points')
  async getPoints(@Headers('authorization') authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.getPointsOverview(user.id);
  }

  @Get('engagements')
  async getEngagements(@Headers('authorization') authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.getEngagements(user.id);
  }

  @Post('engagements')
  async toggleEngagement(@Headers('authorization') authorization: string | undefined, @Body() body: ToggleCardEngagementDto) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.meService.toggleCardEngagement(user.id, body.cardId, body.type, body.active);
  }
}
