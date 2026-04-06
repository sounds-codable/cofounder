import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CreateDetailRequestDto } from './dto/create-detail-request.dto';
import { RejectDetailRequestDto } from './dto/reject-detail-request.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(
    private readonly authService: AuthService,
    private readonly requestsService: RequestsService,
  ) {}

  @Get()
  async listMine(@Headers('authorization') authorization?: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.requestsService.listForUser(user.id);
  }

  @Post()
  async create(@Headers('authorization') authorization: string | undefined, @Body() body: CreateDetailRequestDto) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.requestsService.createRequest(user, body.cardId);
  }

  @Post(':id/view-requester-detail')
  async viewRequesterDetail(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.requestsService.viewRequesterDetail(user.id, id);
  }

  @Post(':id/approve')
  async approve(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.requestsService.approveRequest(user.id, id);
  }

  @Post(':id/reject')
  async reject(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: RejectDetailRequestDto,
  ) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.requestsService.rejectRequest(user.id, id, body.reason);
  }

  @Post(':id/exchange-contact')
  async exchangeContact(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.requestsService.exchangeContact(user.id, id);
  }

  @Post(':id/mark-exchange-reviewing')
  async markExchangeReviewing(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.requestsService.markExchangeReviewing(user.id, id);
  }

  @Post(':id/decline-contact')
  async declineContact(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: RejectDetailRequestDto,
  ) {
    const user = await this.authService.getRequiredUserFromAuthorizationHeader(authorization);
    return this.requestsService.declineContactByRequester(user.id, id, body.reason);
  }
}
