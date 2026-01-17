import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from '../entities/community.entity';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Injectable()
export class CommunitiesService {
    constructor(
        @InjectRepository(Community)
        private communityRepository: Repository<Community>,
    ) { }

    async create(createCommunityDto: CreateCommunityDto): Promise<Community> {
        // Check if code already exists
        const existing = await this.communityRepository.findOne({
            where: { code: createCommunityDto.code },
        });

        if (existing) {
            throw new BadRequestException('Community code already exists');
        }

        const community = this.communityRepository.create(createCommunityDto);
        return await this.communityRepository.save(community);
    }

    async findAll(filters?: {
        parishId?: string;
        presbyteryId?: string;
    }): Promise<Community[]> {
        const query: any = {
            relations: ['parish', 'parish.presbytery'],
            order: { name: 'ASC' },
        };

        const where: any = {};
        if (filters?.parishId) where.parishId = filters.parishId;

        if (Object.keys(where).length > 0) {
            query.where = where;
        }

        const communities = await this.communityRepository.find(query);

        // Filter by presbytery if needed
        if (filters?.presbyteryId) {
            return communities.filter(
                (c) => c.parish?.presbyteryId === filters.presbyteryId
            );
        }

        return communities;
    }

    async findOne(id: string): Promise<Community> {
        const community = await this.communityRepository.findOne({
            where: { id },
            relations: ['parish', 'parish.presbytery'],
        });

        if (!community) {
            throw new NotFoundException(`Community with ID ${id} not found`);
        }

        return community;
    }

    async findByCode(code: string): Promise<Community> {
        const community = await this.communityRepository.findOne({
            where: { code },
            relations: ['parish', 'parish.presbytery'],
        });

        if (!community) {
            throw new NotFoundException(`Community with code ${code} not found`);
        }

        return community;
    }

    async update(
        id: string,
        updateCommunityDto: UpdateCommunityDto,
    ): Promise<Community> {
        const community = await this.findOne(id);

        // Check code uniqueness if updating
        if (
            updateCommunityDto.code &&
            updateCommunityDto.code !== community.code
        ) {
            const existing = await this.communityRepository.findOne({
                where: { code: updateCommunityDto.code },
            });
            if (existing) {
                throw new BadRequestException('Community code already exists');
            }
        }

        Object.assign(community, updateCommunityDto);
        return await this.communityRepository.save(community);
    }

    async remove(id: string): Promise<void> {
        const community = await this.findOne(id);
        await this.communityRepository.remove(community);
    }

    async getStatistics(id: string): Promise<any> {
        const community = await this.findOne(id);

        return {
            id: community.id,
            name: community.name,
            code: community.code,
            parish: {
                id: community.parish.id,
                name: community.parish.name,
            },
            presbytery: {
                id: community.parish.presbytery?.id,
                name: community.parish.presbytery?.name,
            },
            totalMembers: community.totalMembers,
            leader: {
                name: community.leaderName,
                phone: community.leaderPhone,
                email: community.leaderEmail,
            },
            assistant: {
                name: community.assistantLeaderName,
            },
            meetingSchedule: community.meetingSchedule,
        };
    }

    async updateStatistics(id: string): Promise<Community> {
        const community = await this.findOne(id);

        // Recalculate member count from members table
        // This would require Member entity relationship
        // For now, keep existing count

        return await this.communityRepository.save(community);
    }

    async search(query: string): Promise<Community[]> {
        return await this.communityRepository
            .createQueryBuilder('community')
            .leftJoinAndSelect('community.parish', 'parish')
            .leftJoinAndSelect('parish.presbytery', 'presbytery')
            .where('community.name ILIKE :query', { query: `%${query}%` })
            .orWhere('community.code ILIKE :query', { query: `%${query}%` })
            .orWhere('community.location ILIKE :query', { query: `%${query}%` })
            .orderBy('community.name', 'ASC')
            .getMany();
    }
}
