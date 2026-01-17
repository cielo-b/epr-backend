import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Clergy, ClergyStatus, ClergyRank } from '../entities/clergy.entity';
import { CreateClergyDto } from './dto/create-clergy.dto';
import { UpdateClergyDto } from './dto/update-clergy.dto';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class ClergyService {
    constructor(
        @InjectRepository(Clergy)
        private readonly clergyRepository: Repository<Clergy>,
    ) { }

    async create(createClergyDto: CreateClergyDto, user?: User): Promise<Clergy> {
        // Enforce scope on creation
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            // Presbytery roles can create clergy but should be in their presbytery?
            // Actually clergy are often ordained by Synod, but if Presbytery creates, enforce it.
            if (level === 'PRESBYTERY' && createClergyDto.presbyteryId !== targetId) {
                createClergyDto.presbyteryId = targetId;
            }
            // Parish roles unlikely to create clergy, but if so, enforce parish
            if (level === 'PARISH' && createClergyDto.parishId !== targetId) {
                createClergyDto.parishId = targetId;
            }
        }

        // Check if clergy number already exists
        const existing = await this.clergyRepository.findOne({
            where: { clergyNumber: createClergyDto.clergyNumber },
        });
        if (existing) {
            throw new ConflictException('Clergy number already exists');
        }

        const clergy = this.clergyRepository.create({
            ...createClergyDto,
            dateOfBirth: new Date(createClergyDto.dateOfBirth),
            ordinationDate: new Date(createClergyDto.ordinationDate),
            graduationDate: createClergyDto.graduationDate ? new Date(createClergyDto.graduationDate) : undefined,
            assignmentDate: createClergyDto.assignmentDate ? new Date(createClergyDto.assignmentDate) : undefined,
        });

        return this.clergyRepository.save(clergy);
    }

    async findAll(filters?: {
        parishId?: string;
        presbyteryId?: string;
        rank?: ClergyRank;
        status?: ClergyStatus;
    }, user?: User): Promise<Clergy[]> {
        const where: any = { isActive: true };
        if (filters?.parishId) where.parishId = filters.parishId;
        if (filters?.presbyteryId) where.presbyteryId = filters.presbyteryId;
        if (filters?.rank) where.rank = filters.rank;
        if (filters?.status) where.status = filters.status;

        // Apply Scope Filtering
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PRESBYTERY') {
                where.presbyteryId = targetId;
                // Note: If finding by parishId, ensure that parish belongs to this presbytery?
                // For now, filtering by presbyteryId on the clergy record handles direct assignment.
            } else if (level === 'PARISH') {
                where.parishId = targetId;
            }
        }

        return this.clergyRepository.find({
            where,
            relations: ['parish', 'presbytery'],
            order: { lastName: 'ASC', firstName: 'ASC' },
        });
    }

    async findOne(id: string, user?: User): Promise<Clergy> {
        const clergy = await this.clergyRepository.findOne({
            where: { id, isActive: true },
            relations: ['parish', 'presbytery'],
        });
        if (!clergy) {
            throw new NotFoundException(`Clergy with ID ${id} not found`);
        }

        // Scope Check
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PRESBYTERY' && clergy.presbyteryId !== targetId) {
                // Allow if clergy belongs to a parish in this presbytery?
                // Currently only checking direct link.
                throw new NotFoundException('Access denied (Out of scope)');
            }
            if (level === 'PARISH' && clergy.parishId !== targetId) {
                throw new NotFoundException('Access denied (Out of scope)');
            }
        }

        return clergy;
    }

    async findByClergyNumber(clergyNumber: string): Promise<Clergy> {
        const clergy = await this.clergyRepository.findOne({
            where: { clergyNumber, isActive: true },
            relations: ['parish', 'presbytery'],
        });
        if (!clergy) {
            throw new NotFoundException(`Clergy with number ${clergyNumber} not found`);
        }
        return clergy;
    }

    async update(id: string, updateClergyDto: UpdateClergyDto, user?: User): Promise<Clergy> {
        const clergy = await this.findOne(id, user);

        const updatedData: any = { ...updateClergyDto };
        if (updateClergyDto.dateOfBirth) updatedData.dateOfBirth = new Date(updateClergyDto.dateOfBirth);
        if (updateClergyDto.ordinationDate) updatedData.ordinationDate = new Date(updateClergyDto.ordinationDate);
        if (updateClergyDto.graduationDate) updatedData.graduationDate = new Date(updateClergyDto.graduationDate);
        if (updateClergyDto.assignmentDate) updatedData.assignmentDate = new Date(updateClergyDto.assignmentDate);

        Object.assign(clergy, updatedData);
        return this.clergyRepository.save(clergy);
    }

    async search(query: string, user?: User): Promise<Clergy[]> {
        const builder = this.clergyRepository.createQueryBuilder('clergy')
            .leftJoinAndSelect('clergy.parish', 'parish')
            .leftJoinAndSelect('clergy.presbytery', 'presbytery')
            .where('clergy.isActive = :isActive', { isActive: true })
            .andWhere('(clergy.firstName ILIKE :query OR clergy.lastName ILIKE :query OR clergy.clergyNumber ILIKE :query OR clergy.email ILIKE :query)', { query: `%${query}%` });

        // Apply Scope Filtering
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PRESBYTERY') {
                builder.andWhere('clergy.presbyteryId = :targetId', { targetId });
            } else if (level === 'PARISH') {
                builder.andWhere('clergy.parishId = :targetId', { targetId });
            }
        }

        return builder.take(20).getMany();
    }

    async registerTransfer(id: string, transferData: {
        newParishId?: string;
        newPresbyteryId?: string;
        newAssignment: string;
        transferDate: string;
    }, user?: User): Promise<Clergy> {
        const clergy = await this.findOne(id, user);

        // Save current assignment to history
        const historyEntry = {
            position: clergy.currentAssignment || 'Unknown',
            location: clergy.parish?.name || clergy.presbytery?.name || 'Unknown',
            startDate: clergy.assignmentDate?.toISOString() || clergy.createdAt.toISOString(),
            endDate: new Date(transferData.transferDate).toISOString(),
        };

        const previousAssignments = clergy.previousAssignments || [];
        previousAssignments.push(historyEntry);

        clergy.previousAssignments = previousAssignments;
        clergy.parishId = transferData.newParishId;
        clergy.presbyteryId = transferData.newPresbyteryId;
        clergy.currentAssignment = transferData.newAssignment;
        clergy.assignmentDate = new Date(transferData.transferDate);

        return this.clergyRepository.save(clergy);
    }

    async getStatistics(): Promise<any> {
        const total = await this.clergyRepository.count({ where: { isActive: true } });
        const byRank = await this.clergyRepository
            .createQueryBuilder('clergy')
            .select('clergy.rank', 'rank')
            .addSelect('COUNT(*)', 'count')
            .where('clergy.isActive = :isActive', { isActive: true })
            .groupBy('clergy.rank')
            .getRawMany();

        const byStatus = await this.clergyRepository
            .createQueryBuilder('clergy')
            .select('clergy.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('clergy.isActive = :isActive', { isActive: true })
            .groupBy('clergy.status')
            .getRawMany();

        return {
            total,
            byRank,
            byStatus,
        };
    }

    async remove(id: string, user?: User): Promise<void> {
        const clergy = await this.findOne(id, user);
        clergy.isActive = false;
        await this.clergyRepository.save(clergy);
    }
}
