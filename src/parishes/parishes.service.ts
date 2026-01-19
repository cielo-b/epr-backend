import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parish } from '../entities/parish.entity';
import { CreateParishDto } from './dto/create-parish.dto';
import { UpdateParishDto } from './dto/update-parish.dto';

@Injectable()
export class ParishesService {
    constructor(
        @InjectRepository(Parish)
        private parishRepository: Repository<Parish>,
    ) { }

    async create(createParishDto: CreateParishDto): Promise<Parish> {
        // Auto-generate code if not provided
        if (!createParishDto.code) {
            const count = await this.parishRepository.count();
            const prefix = createParishDto.name
                .split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .join('')
                .substring(0, 3);
            createParishDto.code = `${prefix}${String(count + 1).padStart(3, '0')}`;
        }

        const parish = this.parishRepository.create(createParishDto);
        return await this.parishRepository.save(parish);
    }

    async findAll(presbyteryId?: string): Promise<Parish[]> {
        const query: any = {
            relations: ['presbytery', 'communities'],
            order: { name: 'ASC' },
        };

        if (presbyteryId) {
            query.where = { presbyteryId };
        }

        return await this.parishRepository.find(query);
    }

    async findOne(id: string): Promise<Parish> {
        const parish = await this.parishRepository.findOne({
            where: { id },
            relations: ['presbytery', 'communities'],
        });

        if (!parish) {
            throw new NotFoundException(`Parish with ID ${id} not found`);
        }

        return parish;
    }

    async findByCode(code: string): Promise<Parish> {
        const parish = await this.parishRepository.findOne({
            where: { code },
            relations: ['presbytery', 'communities'],
        });

        if (!parish) {
            throw new NotFoundException(`Parish with code ${code} not found`);
        }

        return parish;
    }

    async update(id: string, updateParishDto: UpdateParishDto): Promise<Parish> {
        const parish = await this.findOne(id);
        Object.assign(parish, updateParishDto);
        return await this.parishRepository.save(parish);
    }

    async remove(id: string): Promise<void> {
        const parish = await this.findOne(id);
        await this.parishRepository.remove(parish);
    }

    async getStatistics(id: string): Promise<any> {
        const parish = await this.findOne(id);

        return {
            id: parish.id,
            name: parish.name,
            code: parish.code,
            presbytery: {
                id: parish.presbytery.id,
                name: parish.presbytery.name,
            },
            totalMembers: parish.totalMembers,
            totalCommunities: parish.totalCommunities,
            totalBaptisms: parish.totalBaptisms,
            totalConfirmations: parish.totalConfirmations,
            totalMarriages: parish.totalMarriages,
            communities: parish.communities?.map(c => ({
                id: c.id,
                name: c.name,
                totalMembers: c.totalMembers,
            })),
        };
    }

    async updateStatistics(id: string): Promise<Parish> {
        const parish = await this.findOne(id);

        // Recalculate statistics from communities
        parish.totalCommunities = parish.communities?.length || 0;
        parish.totalMembers = parish.communities?.reduce(
            (sum, community) => sum + (community.totalMembers || 0),
            0,
        ) || 0;

        return await this.parishRepository.save(parish);
    }

    async search(query: string): Promise<Parish[]> {
        return await this.parishRepository
            .createQueryBuilder('parish')
            .leftJoinAndSelect('parish.presbytery', 'presbytery')
            .where('parish.name ILIKE :query', { query: `%${query}%` })
            .orWhere('parish.code ILIKE :query', { query: `%${query}%` })
            .orWhere('parish.location ILIKE :query', { query: `%${query}%` })
            .orderBy('parish.name', 'ASC')
            .getMany();
    }
}
