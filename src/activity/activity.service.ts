import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class ActivityService {
    constructor(
        @InjectRepository(ActivityLog)
        private repo: Repository<ActivityLog>,
    ) { }

    async logAction(
        actorId: string,
        action: string,
        description: string,
        projectId?: string,
    ) {
        const log = this.repo.create({
            actorId,
            action,
            description,
            projectId,
        });
        return this.repo.save(log);
    }

    async getProjectLogs(projectId: string) {
        return this.repo.find({
            where: { projectId },
            order: { timestamp: 'DESC' },
            relations: ['actor'],
        });
    }
}
