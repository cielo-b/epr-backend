import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sacrament } from '../entities/sacrament.entity';
import { CreateSacramentDto } from './dto/create-sacrament.dto';
import { UpdateSacramentDto } from './dto/update-sacrament.dto';

@Injectable()
export class SacramentsService {
    constructor(
        @InjectRepository(Sacrament)
        private sacramentRepository: Repository<Sacrament>,
    ) { }

    async create(createSacramentDto: CreateSacramentDto): Promise<Sacrament> {
        // Generate certificate number if not provided
        if (!createSacramentDto.certificateNumber) {
            createSacramentDto.certificateNumber = await this.generateCertificateNumber(
                createSacramentDto.type,
            );
        }

        const sacrament = this.sacramentRepository.create(createSacramentDto as any);
        return await this.sacramentRepository.save(sacrament) as unknown as Sacrament;
    }

    async findAll(filters?: {
        type?: string;
        parishId?: string;
        presbyteryId?: string;
        memberId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Sacrament[]> {
        const query = this.sacramentRepository.createQueryBuilder('sacrament');

        if (filters?.type) {
            query.andWhere('sacrament.type = :type', { type: filters.type });
        }

        if (filters?.parishId) {
            query.andWhere('sacrament.parishId = :parishId', { parishId: filters.parishId });
        }

        if (filters?.memberId) {
            query.andWhere('sacrament.memberId = :memberId', { memberId: filters.memberId });
        }

        if (filters?.startDate && filters?.endDate) {
            query.andWhere('sacrament.date BETWEEN :startDate AND :endDate', {
                startDate: filters.startDate,
                endDate: filters.endDate,
            });
        }

        query.orderBy('sacrament.date', 'DESC');

        return await query.getMany();
    }

    async findOne(id: string): Promise<Sacrament> {
        const sacrament = await this.sacramentRepository.findOne({
            where: { id },
            relations: ['member', 'parish'],
        });

        if (!sacrament) {
            throw new NotFoundException(`Sacrament with ID ${id} not found`);
        }

        return sacrament;
    }

    async findByCertificateNumber(certificateNumber: string): Promise<Sacrament> {
        const sacrament = await this.sacramentRepository.findOne({
            where: { certificateNumber },
            relations: ['member', 'parish'],
        });

        if (!sacrament) {
            throw new NotFoundException(
                `Sacrament with certificate number ${certificateNumber} not found`,
            );
        }

        return sacrament;
    }

    async update(
        id: string,
        updateSacramentDto: UpdateSacramentDto,
    ): Promise<Sacrament> {
        const sacrament = await this.findOne(id);
        Object.assign(sacrament, updateSacramentDto);
        return await this.sacramentRepository.save(sacrament);
    }

    async remove(id: string): Promise<void> {
        const sacrament = await this.findOne(id);
        await this.sacramentRepository.remove(sacrament);
    }

    async getStatistics(filters?: {
        parishId?: string;
        presbyteryId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<any> {
        const query = this.sacramentRepository.createQueryBuilder('sacrament');

        if (filters?.parishId) {
            query.andWhere('sacrament.parishId = :parishId', { parishId: filters.parishId });
        }

        if (filters?.startDate && filters?.endDate) {
            query.andWhere('sacrament.date BETWEEN :startDate AND :endDate', {
                startDate: filters.startDate,
                endDate: filters.endDate,
            });
        }

        const [sacraments, total] = await query.getManyAndCount();

        const byType = await this.sacramentRepository
            .createQueryBuilder('sacrament')
            .select('sacrament.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('sacrament.type')
            .getRawMany();

        const byMonth = await this.sacramentRepository
            .createQueryBuilder('sacrament')
            .select("DATE_TRUNC('month', sacrament.date)", 'month')
            .addSelect('COUNT(*)', 'count')
            .groupBy("DATE_TRUNC('month', sacrament.date)")
            .orderBy("DATE_TRUNC('month', sacrament.date)", 'DESC')
            .limit(12)
            .getRawMany();

        return {
            total,
            byType,
            byMonth,
        };
    }

    async generateCertificateNumber(type: string): Promise<string> {
        const year = new Date().getFullYear();
        const typePrefix = type.substring(0, 3).toUpperCase();

        // Get count of sacraments of this type this year
        const count = await this.sacramentRepository
            .createQueryBuilder('sacrament')
            .where('sacrament.type = :type', { type })
            .andWhere("EXTRACT(YEAR FROM sacrament.date) = :year", { year })
            .getCount();

        const sequence = (count + 1).toString().padStart(4, '0');
        return `EPR-${typePrefix}-${year}-${sequence}`;
    }

    // This would be implemented with a PDF generation library
    async generateCertificate(id: string): Promise<any> {
        const sacrament = await this.findOne(id);

        // TODO: Implement PDF generation
        // For now, return sacrament data
        return {
            message: 'Certificate generation not yet implemented',
            sacrament,
            certificateNumber: sacrament.certificateNumber,
        };
    }
}
