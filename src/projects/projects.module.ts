import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from '../entities/project.entity';
import { ProjectAssignment } from '../entities/project-assignment.entity';
import { User } from '../entities/user.entity';
import { Document } from '../entities/document.entity';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectAssignment, User, Document]),
    ActivityModule,
    NotificationsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule { }

