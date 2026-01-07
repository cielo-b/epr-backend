import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from '../entities/report.entity';
import { Project } from '../entities/project.entity';
import { User } from '../entities/user.entity';
import { Document } from '../entities/document.entity';
import { Task } from '../entities/task.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Project, User, Document, Task]),
    NotificationsModule
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule { }

