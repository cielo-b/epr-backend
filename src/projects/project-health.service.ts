import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ApplicationStatus } from '../entities/project.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class ProjectHealthService {
    private readonly logger = new Logger(ProjectHealthService.name);

    constructor(
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private notificationsService: NotificationsService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async checkHealth() {
        this.logger.log('Checking projects health...');
        const deployedProjects = await this.projectRepository.find({
            where: { isDeployed: true },
            relations: ['manager', 'creator', 'assignments', 'assignments.developer'],
        });

        for (const project of deployedProjects) {
            if (!project.productionUrl) continue;

            let url = project.productionUrl;
            if (!url.startsWith('http')) {
                url = 'https://' + url;
            }

            // Ensure slash between base and endpoint if needed, but endpoint usually starts with /
            const endpoint = project.healthCheckEndpoint || '/';
            const cleanUrl = url.replace(/\/$/, '');
            const healthUrl = `${cleanUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

            let status: ApplicationStatus = ApplicationStatus.DOWN;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(healthUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    status = ApplicationStatus.UP;
                } else {
                    this.logger.warn(`Project ${project.name} returned ${response.status} at ${healthUrl}`);
                    status = ApplicationStatus.DOWN;
                }
            } catch (error) {
                this.logger.error(`Failed to ping ${project.name} at ${healthUrl}: ${error.message}`);
                status = ApplicationStatus.DOWN;
            }

            // Check if status changed
            if (project.lastHealthCheckStatus !== status) {
                if (status === ApplicationStatus.DOWN) {
                    await this.notifyDowntime(project, healthUrl);
                } else if (status === ApplicationStatus.UP && project.lastHealthCheckStatus === ApplicationStatus.DOWN) {
                    await this.notifyRecovery(project, healthUrl);
                }
            }

            project.lastHealthCheckStatus = status;
            project.lastHealthCheckTime = new Date();
            await this.projectRepository.save(project);
        }
    }

    private async notifyDowntime(project: Project, url: string) {
        this.logger.warn(`Project ${project.name} is DOWN at ${url}`);
        const recipients = await this.getRecipients(project);

        for (const user of recipients) {
            await this.notificationsService.notifyUser(
                user.id,
                `URGENT: Project ${project.name} is DOWN`,
                `The project ${project.name} is unreachable at ${url}. Please investigate immediately.`,
                'ERROR'
            );
        }
    }

    private async notifyRecovery(project: Project, url: string) {
        this.logger.log(`Project ${project.name} is UP at ${url}`);
        const recipients = await this.getRecipients(project);

        for (const user of recipients) {
            await this.notificationsService.notifyUser(
                user.id,
                `Project ${project.name} is back UP`,
                `The project ${project.name} is now reachable at ${url}.`,
                'SUCCESS'
            );
        }
    }

    private async getRecipients(project: Project): Promise<User[]> {
        const devOpsUsers = await this.userRepository.find({ where: { role: UserRole.DEVOPS } });
        const recipientsMap = new Map<string, User>();

        // Add all DevOps users
        devOpsUsers.forEach(u => recipientsMap.set(u.id, u));

        // Add project manager and creator
        if (project.manager) recipientsMap.set(project.manager.id, project.manager);
        if (project.creator) recipientsMap.set(project.creator.id, project.creator);

        // Add all assigned developers
        if (project.assignments) {
            project.assignments.forEach(assignment => {
                if (assignment.developer) {
                    recipientsMap.set(assignment.developer.id, assignment.developer);
                }
            });
        }

        return Array.from(recipientsMap.values());
    }
}
