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

import { ProjectComponentsService } from './project-components.service';
import { ProjectComponentsController } from './project-components.controller';
import { ProjectComponent } from '../entities/project-component.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectAssignment, User, Document, UserPermission, ProjectComponent]),
    ActivityModule,
    NotificationsModule,
  ],
  controllers: [ProjectsController, ProjectComponentsController],
  providers: [ProjectsService, ProjectHealthService, ProjectComponentsService],
  exports: [ProjectsService],
})
export class ProjectsModule { }

