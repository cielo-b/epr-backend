import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Milestone } from '../entities/milestone.entity';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto/milestone.dto';

@Injectable()
export class MilestonesService {
    constructor(
        @InjectRepository(Milestone)
        private readonly milestoneRepository: Repository<Milestone>,
    ) { }

    async create(createMilestoneDto: CreateMilestoneDto) {
        const milestone = this.milestoneRepository.create({
            ...createMilestoneDto,
            dueDate: new Date(createMilestoneDto.dueDate),
        });
        return this.milestoneRepository.save(milestone);
    }

    async findAll() {
        return this.milestoneRepository.find({
            relations: ['project'],
            order: { dueDate: 'ASC' },
        });
    }

    async findByProject(projectId: string) {
        return this.milestoneRepository.find({
            where: { projectId },
            order: { dueDate: 'ASC' },
        });
    }

    async update(id: string, updateMilestoneDto: UpdateMilestoneDto) {
        const milestone = await this.milestoneRepository.findOne({ where: { id } });
        if (!milestone) {
            throw new NotFoundException('Milestone not found');
        }

        if (updateMilestoneDto.isCompleted && !milestone.isCompleted) {
            milestone.completedAt = new Date();
        }

        Object.assign(milestone, {
            ...updateMilestoneDto,
            dueDate: updateMilestoneDto.dueDate ? new Date(updateMilestoneDto.dueDate) : milestone.dueDate,
        });

        return this.milestoneRepository.save(milestone);
    }

    async remove(id: string) {
        const milestone = await this.milestoneRepository.findOne({ where: { id } });
        if (!milestone) {
            throw new NotFoundException('Milestone not found');
        }
        return this.milestoneRepository.remove(milestone);
    }
}
