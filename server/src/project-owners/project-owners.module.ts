import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectOwnersService } from './project-owners.service';
import { ProjectOwnersController } from './project-owners.controller';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project])],
  controllers: [ProjectOwnersController],
  providers: [ProjectOwnersService],
  exports: [ProjectOwnersService],
})
export class ProjectOwnersModule {}
