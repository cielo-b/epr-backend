import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { ProjectAssignment } from '../entities/project-assignment.entity';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class ActivityService {
    constructor(
        @InjectRepository(ActivityLog)
        private repo: Repository<ActivityLog>,
        @InjectRepository(ProjectAssignment)
        private assignmentRepo: Repository<ProjectAssignment>,
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

    async getRecentLogs(userId: string, userRole: string, limit: number = 50) {
        const queryOptions: any = {
            order: { timestamp: 'DESC' },
            relations: ['actor', 'project'],
            take: limit
        };

        if (userRole === UserRole.DEVELOPER) {
            const assignments = await this.assignmentRepo.find({ where: { developerId: userId } });
            const projectIds = assignments.map(a => a.projectId);

            if (projectIds.length > 0) {
                queryOptions.where = { projectId: In(projectIds) };
            } else {
                return []; // No access to any events if not assigned to any project
            }
        }

        return this.repo.find(queryOptions);
    }
}
