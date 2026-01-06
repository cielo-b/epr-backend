import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '../entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ActivityService } from '../activity/activity.service';

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

    async findAll() {
        return this.announcementRepository.find({
            relations: ['author', 'project'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByProject(projectId: string) {
        return this.announcementRepository.find({
            where: { projectId },
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
    }

    async findRecent(limit = 10) {
        return this.announcementRepository.find({
            relations: ['author', 'project'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async remove(id: string) {
        const announcement = await this.announcementRepository.findOne({ where: { id } });
        if (!announcement) {
            throw new NotFoundException('Announcement not found');
        }
        return this.announcementRepository.remove(announcement);
    }
}
