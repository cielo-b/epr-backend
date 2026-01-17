import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Presbytery } from '../entities/presbytery.entity';
import { CreatePresbyteryDto } from './dto/create-presbytery.dto';
import { UpdatePresbyteryDto } from './dto/update-presbytery.dto';

@Injectable()
export class PresbyteriesService {
    constructor(
        @InjectRepository(Presbytery)
        private presbyteryRepository: Repository<Presbytery>,
    ) { }

    async create(createPresbyteryDto: CreatePresbyteryDto): Promise<Presbytery> {
        const presbytery = this.presbyteryRepository.create(createPresbyteryDto);
        return await this.presbyteryRepository.save(presbytery);
    }

    async findAll(): Promise<Presbytery[]> {
        return await this.presbyteryRepository.find({
            relations: ['parishes'],
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Presbytery> {
        const presbytery = await this.presbyteryRepository.findOne({
            where: { id },
            relations: ['parishes'],
        });

        if (!presbytery) {
            throw new NotFoundException(`Presbytery with ID ${id} not found`);
        }

        return presbytery;
    }

    async update(
        id: string,
        updatePresbyteryDto: UpdatePresbyteryDto,
    ): Promise<Presbytery> {
        const presbytery = await this.findOne(id);
        Object.assign(presbytery, updatePresbyteryDto);
        return await this.presbyteryRepository.save(presbytery);
    }

    async remove(id: string): Promise<void> {
        const presbytery = await this.findOne(id);
        await this.presbyteryRepository.remove(presbytery);
    }

    async getStatistics(id: string): Promise<any> {
        const presbytery = await this.findOne(id);

        // Calculate statistics
        const totalParishes = presbytery.parishes?.length || 0;
        const totalCommunities = presbytery.parishes?.reduce(
            (sum, parish) => sum + (parish.totalCommunities || 0),
            0,
        ) || 0;
        const totalMembers = presbytery.parishes?.reduce(
            (sum, parish) => sum + (parish.totalMembers || 0),
            0,
        ) || 0;

        return {
            id: presbytery.id,
            name: presbytery.name,
            totalParishes,
            totalCommunities,
            totalMembers,
            parishes: presbytery.parishes?.map(p => ({
                id: p.id,
                name: p.name,
                totalMembers: p.totalMembers,
                totalCommunities: p.totalCommunities,
            })),
        };
    }

    async updateStatistics(id: string): Promise<Presbytery> {
        const presbytery = await this.findOne(id);

        // Recalculate statistics from parishes
        presbytery.totalParishes = presbytery.parishes?.length || 0;
        presbytery.totalCommunities = presbytery.parishes?.reduce(
            (sum, parish) => sum + (parish.totalCommunities || 0),
            0,
        ) || 0;
        presbytery.totalMembers = presbytery.parishes?.reduce(
            (sum, parish) => sum + (parish.totalMembers || 0),
            0,
        ) || 0;

        return await this.presbyteryRepository.save(presbytery);
    }
}
