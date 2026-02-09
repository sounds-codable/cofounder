import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DevelopersService } from './developers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('developers')
@UseGuards(JwtAuthGuard)
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  // 获取程序员列表（公开）
  @Get()
  @Public()
  async findAll(
    @Query('techDirections') techDirections?: string,
    @Query('interestedIndustries') interestedIndustries?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.developersService.findAll({
      techDirections,
      interestedIndustries,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  // 获取程序员详情（公开）
  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.developersService.findOne(id);
  }
}

