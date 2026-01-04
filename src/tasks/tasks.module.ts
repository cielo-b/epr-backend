import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from '../entities/task.entity';
import { Project } from '../entities/project.entity';
import { User } from '../entities/user.entity';
import { ActivityModule } from '../activity/activity.module';

import { NotificationsModule } from '../notifications/notifications.module';
import { TasksGateway } from './tasks.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task, Project, User]),
        ActivityModule,
        NotificationsModule,
    ],
    controllers: [TasksController],
    providers: [TasksService, TasksGateway],
    exports: [TasksService],
})
export class TasksModule { }
