import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from '../entities/project.entity';
import { ProjectAssignment } from '../entities/project-assignment.entity';
import { User } from '../entities/user.entity';
import { Document } from '../entities/document.entity';
import { UserPermission } from '../entities/user-permission.entity';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectHealthService } from './project-health.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectAssignment, User, Document, UserPermission]),
    ActivityModule,
    NotificationsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectHealthService],
  exports: [ProjectsService],
})
export class ProjectsModule { }

