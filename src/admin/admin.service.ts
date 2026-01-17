import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Presbytery } from '../entities/presbytery.entity';
import { Parish } from '../entities/parish.entity';
import { Community } from '../entities/community.entity';
import { Member } from '../entities/member.entity';
import { Contribution } from '../entities/contribution.entity';
import { ChurchEvent } from '../entities/event.entity';
import { Clergy } from '../entities/clergy.entity';
import { Expense } from '../entities/expense.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Presbytery)
        private presbyteryRepository: Repository<Presbytery>,
        @InjectRepository(Parish)
        private parishRepository: Repository<Parish>,
        @InjectRepository(Community)
        private communityRepository: Repository<Community>,
        @InjectRepository(Member)
        private memberRepository: Repository<Member>,
        @InjectRepository(Contribution)
        private contributionRepository: Repository<Contribution>,
        @InjectRepository(ChurchEvent)
        private eventRepository: Repository<ChurchEvent>,
        @InjectRepository(Clergy)
        private clergyRepository: Repository<Clergy>,
        @InjectRepository(Expense)
        private expenseRepository: Repository<Expense>,
    ) { }

    async getDashboardStats(): Promise<any> {
        const [
            totalUsers,
            totalPresbyteries,
            totalParishes,
            totalCommunities,
            totalMembers,
            totalContributions,
            totalEvents,
            activeUsers,
            recentUsers,
        ] = await Promise.all([
            this.userRepository.count(),
            this.presbyteryRepository.count(),
            this.parishRepository.count(),
            this.communityRepository.count(),
            this.memberRepository.count(),
            this.contributionRepository
                .createQueryBuilder('contribution')
                .select('SUM(contribution.amount)', 'total')
                .getRawOne(),
            this.eventRepository.count(),
            this.userRepository.count({ where: { isActive: true } }),
            this.userRepository.find({
                order: { createdAt: 'DESC' },
                take: 10,
                select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'],
            }),
        ]);

        // Get user distribution by role
        const usersByRole = await this.userRepository
            .createQueryBuilder('user')
            .select('user.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .groupBy('user.role')
            .getRawMany();

        // Get presbytery statistics
        const presbyteryStats = await this.presbyteryRepository.find({
            relations: ['parishes'],
            select: ['id', 'name', 'totalParishes', 'totalCommunities', 'totalMembers'],
        });

        // Get recent activities (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentMembers = await this.memberRepository.count({
            where: {
                createdAt: thirtyDaysAgo as any,
            },
        });

        const recentContributions = await this.contributionRepository
            .createQueryBuilder('contribution')
            .where('contribution.date >= :date', { date: thirtyDaysAgo })
            .select('SUM(contribution.amount)', 'total')
            .getRawOne();

        return {
            overview: {
                totalUsers,
                activeUsers,
                totalPresbyteries,
                totalParishes,
                totalCommunities,
                totalMembers,
                totalContributions: totalContributions?.total || 0,
                totalEvents,
            },
            usersByRole,
            presbyteryStats,
            recentActivity: {
                newMembers: recentMembers,
                contributions: recentContributions?.total || 0,
                period: '30 days',
            },
            recentUsers,
        };
    }

    async getSystemHealth(): Promise<any> {
        const dbConnection = await this.userRepository.query('SELECT 1');

        return {
            status: 'healthy',
            database: dbConnection ? 'connected' : 'disconnected',
            timestamp: new Date(),
            uptime: process.uptime(),
        };
    }

    async getUserStatistics(): Promise<any> {
        const totalUsers = await this.userRepository.count();
        const activeUsers = await this.userRepository.count({ where: { isActive: true } });
        const inactiveUsers = totalUsers - activeUsers;

        const usersByRole = await this.userRepository
            .createQueryBuilder('user')
            .select('user.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .groupBy('user.role')
            .getRawMany();

        const userGrowth = await this.userRepository
            .createQueryBuilder('user')
            .select("DATE_TRUNC('month', user.createdAt)", 'month')
            .addSelect('COUNT(*)', 'count')
            .groupBy("DATE_TRUNC('month', user.createdAt)")
            .orderBy("DATE_TRUNC('month', user.createdAt)", 'DESC')
            .limit(12)
            .getRawMany();

        return {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers,
            byRole: usersByRole,
            growth: userGrowth,
        };
    }

    async getChurchStatistics(): Promise<any> {
        const [presbyteries, parishes, communities, members] = await Promise.all([
            this.presbyteryRepository.find({
                select: ['id', 'name', 'totalParishes', 'totalCommunities', 'totalMembers'],
            }),
            this.parishRepository.count(),
            this.communityRepository.count(),
            this.memberRepository.count(),
        ]);

        const membersByStatus = await this.memberRepository
            .createQueryBuilder('member')
            .select('member.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('member.status')
            .getRawMany();

        const membersByGender = await this.memberRepository
            .createQueryBuilder('member')
            .select('member.gender', 'gender')
            .addSelect('COUNT(*)', 'count')
            .groupBy('member.gender')
            .getRawMany();

        return {
            presbyteries: {
                total: presbyteries.length,
                list: presbyteries,
            },
            parishes: {
                total: parishes,
            },
            communities: {
                total: communities,
            },
            members: {
                total: members,
                byStatus: membersByStatus,
                byGender: membersByGender,
            },
        };
    }

    async getFinancialStatistics(): Promise<any> {
        const totalContributions = await this.contributionRepository
            .createQueryBuilder('contribution')
            .select('SUM(contribution.amount)', 'total')
            .addSelect('COUNT(*)', 'count')
            .getRawOne();

        const contributionsByType = await this.contributionRepository
            .createQueryBuilder('contribution')
            .select('contribution.type', 'type')
            .addSelect('SUM(contribution.amount)', 'total')
            .addSelect('COUNT(*)', 'count')
            .groupBy('contribution.type')
            .getRawMany();

        const contributionsByMonth = await this.contributionRepository
            .createQueryBuilder('contribution')
            .select("DATE_TRUNC('month', contribution.date)", 'month')
            .addSelect('SUM(contribution.amount)', 'total')
            .addSelect('COUNT(*)', 'count')
            .groupBy("DATE_TRUNC('month', contribution.date)")
            .orderBy("DATE_TRUNC('month', contribution.date)", 'DESC')
            .limit(12)
            .getRawMany();

        return {
            total: {
                amount: totalContributions?.total || 0,
                count: totalContributions?.count || 0,
            },
            byType: contributionsByType,
            byMonth: contributionsByMonth,
        };
    }

    async getExpenseStatistics(): Promise<any> {
        const totalExpenses = await this.expenseRepository
            .createQueryBuilder('expense')
            .select('SUM(expense.amount)', 'total')
            .addSelect('COUNT(*)', 'count')
            .getRawOne();

        const expensesByCategory = await this.expenseRepository
            .createQueryBuilder('expense')
            .select('expense.category', 'category')
            .addSelect('SUM(expense.amount)', 'total')
            .groupBy('expense.category')
            .getRawMany();

        return {
            total: {
                amount: parseFloat(totalExpenses?.total || 0),
                count: parseInt(totalExpenses?.count || 0),
            },
            byCategory: expensesByCategory,
        };
    }

    async getClergyStatistics(): Promise<any> {
        const totalClergy = await this.clergyRepository.count({ where: { isActive: true } });

        const byRank = await this.clergyRepository
            .createQueryBuilder('clergy')
            .select('clergy.rank', 'rank')
            .addSelect('COUNT(*)', 'count')
            .where('clergy.isActive = :isActive', { isActive: true })
            .groupBy('clergy.rank')
            .getRawMany();

        return {
            total: totalClergy,
            byRank,
        };
    }
}
