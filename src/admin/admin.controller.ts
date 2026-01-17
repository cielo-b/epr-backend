import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get admin dashboard statistics' })
    @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
    getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('system-health')
    @ApiOperation({ summary: 'Get system health status' })
    @ApiResponse({ status: 200, description: 'System health status' })
    getSystemHealth() {
        return this.adminService.getSystemHealth();
    }

    @Get('statistics/users')
    @ApiOperation({ summary: 'Get detailed user statistics' })
    @ApiResponse({ status: 200, description: 'User statistics' })
    getUserStatistics() {
        return this.adminService.getUserStatistics();
    }

    @Get('statistics/church')
    @ApiOperation({ summary: 'Get church statistics' })
    @ApiResponse({ status: 200, description: 'Church statistics' })
    getChurchStatistics() {
        return this.adminService.getChurchStatistics();
    }

    @Get('statistics/financial')
    @ApiOperation({ summary: 'Get financial statistics' })
    @ApiResponse({ status: 200, description: 'Financial statistics' })
    getFinancialStatistics() {
        return this.adminService.getFinancialStatistics();
    }

    @Get('statistics/expenses')
    @ApiOperation({ summary: 'Get detailed expense statistics' })
    @ApiResponse({ status: 200, description: 'Expense statistics' })
    getExpenseStatistics() {
        return this.adminService.getExpenseStatistics();
    }

    @Get('statistics/clergy')
    @ApiOperation({ summary: 'Get detailed clergy statistics' })
    @ApiResponse({ status: 200, description: 'Clergy statistics' })
    getClergyStatistics() {
        return this.adminService.getClergyStatistics();
    }
}
