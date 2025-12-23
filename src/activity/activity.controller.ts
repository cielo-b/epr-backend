import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Activity')
@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
    constructor(private readonly service: ActivityService) { }

    @Get('project/:projectId')
    getProjectLogs(@Param('projectId') projectId: string) {
        return this.service.getProjectLogs(projectId);
    }
}
