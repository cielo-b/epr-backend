import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ChurchEvent } from '../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(ChurchEvent)
        private eventRepository: Repository<ChurchEvent>,
    ) { }

    async create(createEventDto: CreateEventDto): Promise<ChurchEvent> {
        return await this.eventRepository.save(createEventDto as any);
    }

    async findAll(filters?: {
        type?: string;
        status?: string;
        parishId?: string;
        presbyteryId?: string;
        communityId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<ChurchEvent[]> {
        const query = this.eventRepository.createQueryBuilder('event');

        if (filters?.type) {
            query.andWhere('event.type = :type', { type: filters.type });
        }

        if (filters?.status) {
            query.andWhere('event.status = :status', { status: filters.status });
        }

        if (filters?.parishId) {
            query.andWhere('event.parishId = :parishId', { parishId: filters.parishId });
        }

        if (filters?.presbyteryId) {
            query.andWhere('event.presbyteryId = :presbyteryId', { presbyteryId: filters.presbyteryId });
        }

        if (filters?.communityId) {
            query.andWhere('event.communityId = :communityId', { communityId: filters.communityId });
        }

        if (filters?.startDate && filters?.endDate) {
            query.andWhere('event.startDate BETWEEN :startDate AND :endDate', {
                startDate: filters.startDate,
                endDate: filters.endDate,
            });
        }

        query.orderBy('event.startDate', 'ASC');

        return await query.getMany();
    }

    async findOne(id: string): Promise<ChurchEvent> {
        const event = await this.eventRepository.findOne({
            where: { id },
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        return event;
    }

    async update(id: string, updateEventDto: UpdateEventDto): Promise<ChurchEvent> {
        const event = await this.findOne(id);
        Object.assign(event, updateEventDto as any);
        return await this.eventRepository.save(event);
    }

    async remove(id: string): Promise<void> {
        const event = await this.findOne(id);
        await this.eventRepository.remove(event);
    }

    async getCalendar(year: number, month: number, filters?: {
        parishId?: string;
        presbyteryId?: string;
    }): Promise<ChurchEvent[]> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const query = this.eventRepository.createQueryBuilder('event')
            .where('event.startDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });

        if (filters?.parishId) {
            query.andWhere('event.parishId = :parishId', { parishId: filters.parishId });
        }

        if (filters?.presbyteryId) {
            query.andWhere('event.presbyteryId = :presbyteryId', { presbyteryId: filters.presbyteryId });
        }

        query.orderBy('event.startDate', 'ASC');

        return await query.getMany();
    }

    async recordAttendance(id: string, attendanceData: {
        actualAttendees: number;
        notes?: string;
    }): Promise<ChurchEvent> {
        const event = await this.findOne(id);
        event.actualAttendees = attendanceData.actualAttendees;
        if (attendanceData.notes) {
            event.notes = attendanceData.notes;
        }
        return await this.eventRepository.save(event);
    }

    async getUpcoming(limit: number = 10): Promise<ChurchEvent[]> {
        const now = new Date();
        return await this.eventRepository
            .createQueryBuilder('event')
            .where('event.startDate >= :now', { now })
            .andWhere('event.status != :cancelled', { cancelled: 'CANCELLED' })
            .orderBy('event.startDate', 'ASC')
            .limit(limit)
            .getMany();
    }

    async getStatistics(filters?: {
        parishId?: string;
        presbyteryId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<any> {
        const query = this.eventRepository.createQueryBuilder('event');

        if (filters?.parishId) {
            query.andWhere('event.parishId = :parishId', { parishId: filters.parishId });
        }

        if (filters?.presbyteryId) {
            query.andWhere('event.presbyteryId = :presbyteryId', { presbyteryId: filters.presbyteryId });
        }

        if (filters?.startDate && filters?.endDate) {
            query.andWhere('event.startDate BETWEEN :startDate AND :endDate', {
                startDate: filters.startDate,
                endDate: filters.endDate,
            });
        }

        const [events, total] = await query.getManyAndCount();

        const byType = await this.eventRepository
            .createQueryBuilder('event')
            .select('event.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('event.type')
            .getRawMany();

        const byStatus = await this.eventRepository
            .createQueryBuilder('event')
            .select('event.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('event.status')
            .getRawMany();

        return {
            total,
            byType,
            byStatus,
            totalAttendees: events.reduce((sum, e) => sum + (e.actualAttendees || 0), 0),
            totalBudget: events.reduce((sum, e) => sum + (e.budget || 0), 0),
        };
    }
}
