import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @ApiOperation({ summary: 'Get recent activity logs' })
    findAll(@Query('module') module?: string, @Query('action') action?: string) {
        const filters: any = {};
        if (module) filters.module = module;
        if (action) filters.action = action;
        return this.auditService.findAll(filters);
    }
}
