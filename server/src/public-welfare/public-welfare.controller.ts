import { Body, Controller, Post } from '@nestjs/common';
import { CreatePublicWelfareMessageDto } from './dto/create-public-welfare-message.dto';
import { PublicWelfareService } from './public-welfare.service';

@Controller('public-welfare')
export class PublicWelfareController {
  constructor(private readonly publicWelfareService: PublicWelfareService) {}

  @Post('messages')
  async createMessage(@Body() body: CreatePublicWelfareMessageDto) {
    return this.publicWelfareService.createMessage(body);
  }
}
