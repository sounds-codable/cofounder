import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProjectOwnersService } from './project-owners.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('project-owners')
@UseGuards(JwtAuthGuard)
export class ProjectOwnersController {
  constructor(private readonly projectOwnersService: ProjectOwnersService) {}

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.projectOwnersService.findOne(id);
  }
}
