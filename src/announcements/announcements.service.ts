import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Not } from 'typeorm';
import { Announcement, AnnouncementPriority } from '../entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ActivityService } from '../activity/activity.service';
import { User, UserRole } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AnnouncementsService {
    constructor(
        @InjectRepository(Announcement)
        private readonly announcementRepository: Repository<Announcement>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly activityService: ActivityService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(createAnnouncementDto: CreateAnnouncementDto, authorId: string) {
        const announcement = this.announcementRepository.create({
            ...createAnnouncementDto,
            authorId,
        });
        const saved = await this.announcementRepository.save(announcement);

        await this.activityService.logAction(
            authorId,
            'CREATE_ANNOUNCEMENT',
            `Posted a new announcement: ${announcement.message.substring(0, 50)}${announcement.message.length > 50 ? '...' : ''}`,
            announcement.projectId
        );

        // Notify users
        const author = await this.userRepository.findOne({ where: { id: authorId } });
        const title = `New Announcement${announcement.priority === AnnouncementPriority.HIGH ? ' (High Priority)' : ''}`;
        const message = announcement.message.substring(0, 100) + (announcement.message.length > 100 ? '...' : '');

        if (!announcement.projectId) {
            // Global announcement: notify all active users except author
            const users = await this.userRepository.find({ where: { isActive: true, id: Not(authorId) } });
            for (const user of users) {
                await this.notificationsService.notifyUser(user.id, title, message, 'INFO');
            }
        } else {
            // Project-specific: notify project manager and assigned developers
            const users = await this.userRepository.find({
                where: [
                    { managedProjects: { id: announcement.projectId }, id: Not(authorId) },
                    { assignedProjects: { projectId: announcement.projectId }, id: Not(authorId) }
                ]
            });
            for (const user of users) {
                await this.notificationsService.notifyUser(user.id, title, message, 'INFO');
            }
        }

        return saved;
    }

    private getBaseQuery(user: any) {
        const query = this.announcementRepository.createQueryBuilder('announcement')
            .leftJoinAndSelect('announcement.author', 'author')
            .leftJoinAndSelect('announcement.project', 'project')
            .orderBy('announcement.createdAt', 'DESC');

        // Roles that can see all project announcements
        const privilegedRoles = [UserRole.SUPERADMIN, UserRole.PROJECT_MANAGER, UserRole.DEVOPS, UserRole.BOSS];

        if (privilegedRoles.includes(user.role)) {
            return query;
        }

        // For other users (Developers, Visitors, etc.):
        // 1. Global announcements (projectId is null)
        // 2. Authored by user
        // 3. Assigned to project where user is a developer
        query.leftJoin('project.assignments', 'assignment');

        query.andWhere(new Brackets(qb => {
            qb.where('announcement.projectId IS NULL')
                .orWhere('announcement.authorId = :userId', { userId: user.id })
                .orWhere('assignment.developerId = :userId', { userId: user.id });
        }));

        return query;
    }

    async findAll(user: any) {
        return this.getBaseQuery(user).getMany();
    }

    async findByProject(projectId: string, user: any) {
        const query = this.getBaseQuery(user);
        query.andWhere('announcement.projectId = :projectId', { projectId });
        return query.getMany();
    }

    async findRecent(limit = 10, user: any) {
        return this.getBaseQuery(user)
            .take(limit)
            .getMany();
    }

    async remove(id: string) {
        const announcement = await this.announcementRepository.findOne({ where: { id } });
        if (!announcement) {
            throw new NotFoundException('Announcement not found');
        }
        return this.announcementRepository.remove(announcement);
    }
}
