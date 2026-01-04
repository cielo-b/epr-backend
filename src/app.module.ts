import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';
import { User } from './entities/user.entity';
import { Project } from './entities/project.entity';
import { ProjectAssignment } from './entities/project-assignment.entity';
import { Document } from './entities/document.entity';
import { Report } from './entities/report.entity';
import { Comment } from './entities/comment.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityModule } from './activity/activity.module';
import { CommentsModule } from './comments/comments.module';
import { TasksModule } from './tasks/tasks.module';
import { Task } from './entities/task.entity';
import { Notification } from './entities/notification.entity';
import { UserPermission } from './entities/user-permission.entity';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [User, Project, ProjectAssignment, Document, Report, Comment, ActivityLog, Task, Notification, UserPermission],
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    DocumentsModule,
    ReportsModule,
    ActivityModule,
    CommentsModule,
    TasksModule,
    PermissionsModule,
  ],
})
export class AppModule { }

