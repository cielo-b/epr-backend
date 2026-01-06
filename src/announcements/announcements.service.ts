import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Announcement } from '../entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ActivityService } from '../activity/activity.service';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class AnnouncementsService {
    constructor(
        @InjectRepository(Announcement)
        private readonly announcementRepository: Repository<Announcement>,
        private readonly activityService: ActivityService,
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
