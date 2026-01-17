import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Expense, ExpenseStatus, ExpenseCategory } from '../entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class ExpensesService {
    constructor(
        @InjectRepository(Expense)
        private readonly expenseRepository: Repository<Expense>,
    ) { }

    async create(createExpenseDto: CreateExpenseDto, user?: User): Promise<Expense> {
        // Enforce scope on creation
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PRESBYTERY' && createExpenseDto.presbyteryId !== targetId) {
                createExpenseDto.presbyteryId = targetId;
            }
            if (level === 'PARISH' && createExpenseDto.parishId !== targetId) {
                createExpenseDto.parishId = targetId;
            }
        }

        // Unique voucher check
        const existing = await this.expenseRepository.findOne({
            where: { voucherNumber: createExpenseDto.voucherNumber },
        });
        if (existing) {
            throw new ConflictException('Voucher number already exists');
        }

        const expense = this.expenseRepository.create({
            ...createExpenseDto,
            date: new Date(createExpenseDto.date),
        });

        return this.expenseRepository.save(expense);
    }

    async findAll(filters?: {
        parishId?: string;
        presbyteryId?: string;
        category?: ExpenseCategory;
        status?: ExpenseStatus;
        startDate?: string;
        endDate?: string;
    }, user?: User): Promise<Expense[]> {
        const where: any = {};
        if (filters?.parishId) where.parishId = filters.parishId;
        if (filters?.presbyteryId) where.presbyteryId = filters.presbyteryId;
        if (filters?.category) where.category = filters.category;
        if (filters?.status) where.status = filters.status;

        // Apply Scope Filtering
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PRESBYTERY') {
                where.presbyteryId = targetId;
            } else if (level === 'PARISH') {
                where.parishId = targetId;
            }
        }

        if (filters?.startDate && filters?.endDate) {
            where.date = Between(new Date(filters.startDate), new Date(filters.endDate));
        }

        return this.expenseRepository.find({
            where,
            relations: ['parish', 'presbytery'],
            order: { date: 'DESC' },
        });
    }

    async findOne(id: string, user?: User): Promise<Expense> {
        const expense = await this.expenseRepository.findOne({
            where: { id },
            relations: ['parish', 'presbytery'],
        });
        if (!expense) {
            throw new NotFoundException(`Expense with ID ${id} not found`);
        }

        // Scope Check
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PRESBYTERY' && expense.presbyteryId !== targetId) {
                throw new NotFoundException('Access denied (Out of scope)');
            }
            if (level === 'PARISH' && expense.parishId !== targetId) {
                throw new NotFoundException('Access denied (Out of scope)');
            }
        }

        return expense;
    }

    async update(id: string, updateExpenseDto: UpdateExpenseDto, user?: User): Promise<Expense> {
        const expense = await this.findOne(id, user);

        const updatedData: any = { ...updateExpenseDto };
        if (updateExpenseDto.date) updatedData.date = new Date(updateExpenseDto.date);

        Object.assign(expense, updatedData);
        return this.expenseRepository.save(expense);
    }

    async approveExpense(id: string, approverData: {
        userId: string;
        userName: string;
    }, user?: User): Promise<Expense> {
        const expense = await this.findOne(id, user);
        expense.status = ExpenseStatus.APPROVED;
        expense.approvedBy = approverData.userId;
        expense.approvedByName = approverData.userName;
        expense.approvedDate = new Date();
        return this.expenseRepository.save(expense);
    }

    async markAsPaid(id: string, paymentData: {
        userId: string;
        userName: string;
        method: string;
        reference?: string;
    }, user?: User): Promise<Expense> {
        const expense = await this.findOne(id, user);
        expense.status = ExpenseStatus.PAID;
        expense.paidBy = paymentData.userId;
        expense.paidByName = paymentData.userName;
        expense.paidDate = new Date();
        expense.paymentMethod = paymentData.method;
        expense.transactionReference = paymentData.reference;
        return this.expenseRepository.save(expense);
    }

    async getStatistics(filters?: {
        parishId?: string;
        presbyteryId?: string;
        startDate?: string;
        endDate?: string;
    }, user?: User): Promise<any> {
        const query = this.expenseRepository.createQueryBuilder('expense');

        if (filters?.parishId) query.andWhere('expense.parishId = :parishId', { parishId: filters.parishId });
        if (filters?.presbyteryId) query.andWhere('expense.presbyteryId = :presbyteryId', { presbyteryId: filters.presbyteryId });

        // Scope Filtering
        if (user && user.role !== UserRole.SUPERADMIN && user.customRole) {
            const { level, targetId } = user.customRole;
            if (level === 'PRESBYTERY') {
                query.andWhere('expense.presbyteryId = :targetId', { targetId });
            } else if (level === 'PARISH') {
                query.andWhere('expense.parishId = :targetId', { targetId });
            }
        }

        if (filters?.startDate && filters?.endDate) {
            query.andWhere('expense.date BETWEEN :start AND :end', {
                start: filters.startDate,
                end: filters.endDate,
            });
        }

        const totalAmount = await query.select('SUM(expense.amount)', 'total').getRawOne();
        const byCategory = await query
            .select('expense.category', 'category')
            .addSelect('SUM(expense.amount)', 'total')
            .groupBy('expense.category')
            .getRawMany();

        const byStatus = await query
            .select('expense.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .addSelect('SUM(expense.amount)', 'total')
            .groupBy('expense.status')
            .getRawMany();

        return {
            totalAmount: parseFloat(totalAmount.total || 0),
            byCategory,
            byStatus,
        };
    }

    async remove(id: string, user?: User): Promise<void> {
        const expense = await this.findOne(id, user);
        await this.expenseRepository.remove(expense);
    }

    async generateVoucherNumber(): Promise<string> {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const count = await this.expenseRepository.count();
        return `VOU-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }
}
