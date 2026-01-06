import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Meeting } from '../entities/meeting.entity';
import { User } from '../entities/user.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class MeetingsService {
    constructor(
        @InjectRepository(Meeting)
        private readonly meetingRepository: Repository<Meeting>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly notificationsService: NotificationsService,
        private readonly activityService: ActivityService,
    ) { }

    async create(createMeetingDto: CreateMeetingDto, organizerId: string) {
        const { attendeeIds, ...meetingData } = createMeetingDto;

        const attendees = attendeeIds && attendeeIds.length > 0
            ? await this.userRepository.findBy({ id: In(attendeeIds) })
            : [];

        const meeting = this.meetingRepository.create({
            ...meetingData,
            startTime: new Date(meetingData.startTime),
            endTime: new Date(meetingData.endTime),
            organizerId,
            attendees,
        });

        const savedMeeting = await this.meetingRepository.save(meeting);

        // Log Activity
        await this.activityService.logAction(
            organizerId,
            'SCHEDULE_MEETING',
            `Scheduled a meeting: ${savedMeeting.title}`,
            savedMeeting.projectId
        );

        // Notify all attendees
        for (const attendee of attendees) {
            await this.notificationsService.notifyUser(
                attendee.id,
                `New Meeting: ${savedMeeting.title}`,
                `You have been invited to a meeting: "${savedMeeting.title}" starting at ${new Date(savedMeeting.startTime).toLocaleString()}.`,
                'INFO'
            );
        }

        return savedMeeting;
    }

    async findAll() {
        return this.meetingRepository.find({
            relations: ['organizer', 'project', 'attendees'],
            order: { startTime: 'ASC' },
        });
    }

    async findByUser(userId: string) {
        // Meetings where user is organizer OR attendee
        return this.meetingRepository.createQueryBuilder('meeting')
            .leftJoinAndSelect('meeting.organizer', 'organizer')
            .leftJoinAndSelect('meeting.project', 'project')
            .leftJoinAndSelect('meeting.attendees', 'attendee')
            .where('meeting.organizerId = :userId', { userId })
            .orWhere('attendee.id = :userId', { userId })
            .orderBy('meeting.startTime', 'ASC')
            .getMany();
    }

    async remove(id: string) {
        const meeting = await this.meetingRepository.findOne({ where: { id } });
        if (!meeting) {
            throw new NotFoundException('Meeting not found');
        }
        return this.meetingRepository.remove(meeting);
    }
}
