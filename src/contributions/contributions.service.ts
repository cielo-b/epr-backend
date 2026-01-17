import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Contribution, ContributionType } from '../entities/contribution.entity';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';

@Injectable()
export class ContributionsService {
    constructor(
        @InjectRepository(Contribution)
        private contributionRepository: Repository<Contribution>,
    ) { }

    async create(createContributionDto: CreateContributionDto): Promise<Contribution> {
        // Check if receipt number already exists
        const existing = await this.contributionRepository.findOne({
            where: { receiptNumber: createContributionDto.receiptNumber },
        });

        if (existing) {
            throw new BadRequestException('Receipt number already exists');
        }

        const contribution = this.contributionRepository.create(createContributionDto);
        return await this.contributionRepository.save(contribution);
    }

    async findAll(filters?: {
        parishId?: string;
        presbyteryId?: string;
        type?: ContributionType;
        startDate?: string;
        endDate?: string;
    }): Promise<Contribution[]> {
        const query: any = {
            relations: ['parish', 'presbytery', 'member'],
            order: { date: 'DESC' },
        };

        const where: any = {};
        if (filters?.parishId) where.parishId = filters.parishId;
        if (filters?.presbyteryId) where.presbyteryId = filters.presbyteryId;
        if (filters?.type) where.type = filters.type;

        if (filters?.startDate && filters?.endDate) {
            where.date = Between(new Date(filters.startDate), new Date(filters.endDate));
        }

        if (Object.keys(where).length > 0) {
            query.where = where;
        }

        return await this.contributionRepository.find(query);
    }

    async findOne(id: string): Promise<Contribution> {
        const contribution = await this.contributionRepository.findOne({
            where: { id },
            relations: ['parish', 'presbytery', 'member'],
        });

        if (!contribution) {
            throw new NotFoundException(`Contribution with ID ${id} not found`);
        }

        return contribution;
    }

    async findByReceiptNumber(receiptNumber: string): Promise<Contribution> {
        const contribution = await this.contributionRepository.findOne({
            where: { receiptNumber },
            relations: ['parish', 'presbytery', 'member'],
        });

        if (!contribution) {
            throw new NotFoundException(
                `Contribution with receipt number ${receiptNumber} not found`,
            );
        }

        return contribution;
    }

    async update(
        id: string,
        updateContributionDto: UpdateContributionDto,
    ): Promise<Contribution> {
        const contribution = await this.findOne(id);
        Object.assign(contribution, updateContributionDto);
        return await this.contributionRepository.save(contribution);
    }

    async remove(id: string): Promise<void> {
        const contribution = await this.findOne(id);
        await this.contributionRepository.remove(contribution);
    }

    async getFinancialSummary(filters?: {
        parishId?: string;
        presbyteryId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<any> {
        const contributions = await this.findAll(filters);

        const totalAmount = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
        const totalCount = contributions.length;

        const byType = Object.values(ContributionType).reduce((acc, type) => {
            const filtered = contributions.filter(c => c.type === type);
            acc[type] = {
                count: filtered.length,
                amount: filtered.reduce((sum, c) => sum + Number(c.amount), 0),
            };
            return acc;
        }, {} as any);

        const byPaymentMethod = contributions.reduce((acc, c) => {
            if (!acc[c.paymentMethod]) {
                acc[c.paymentMethod] = { count: 0, amount: 0 };
            }
            acc[c.paymentMethod].count++;
            acc[c.paymentMethod].amount += Number(c.amount);
            return acc;
        }, {} as any);

        return {
            totalAmount,
            totalCount,
            byType,
            byPaymentMethod,
            period: filters?.startDate && filters?.endDate
                ? { start: filters.startDate, end: filters.endDate }
                : null,
        };
    }

    async getMonthlyReport(year: number, month: number, parishId?: string): Promise<any> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        return this.getFinancialSummary({
            parishId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
    }
}
