import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../common/enums/user-role.enum';
import { PlatformService } from './platform.service';

@Controller('platform')
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly authService: AuthService,
  ) {}

  @Get('overview')
  getOverview() {
    return this.platformService.getOverview();
  }

  @Get('cards')
  listCards(@Query('role') role?: UserRole) {
    return this.platformService.listCards(role);
  }

  @Get('tags')
  listTagSuggestions(@Query('query') query?: string, @Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 8);
    return this.platformService.listTagSuggestions(query, Number.isFinite(parsedLimit) ? parsedLimit : 8);
  }

  @Get('cards/:id')
  async getCardById(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const user = await this.authService.getOptionalUserFromAuthorizationHeader(authorization);
    return this.platformService.getCardById(id, user?.id ?? null);
  }

  @Get('request-states')
  getRequestStates() {
    return this.platformService.getRequestStates();
  }
}
