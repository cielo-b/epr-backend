import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';

import { ProjectAssignment } from '../entities/project-assignment.entity';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([ActivityLog, ProjectAssignment])],
    controllers: [ActivityController],
    providers: [ActivityService],
    exports: [ActivityService],
})
export class ActivityModule { }
