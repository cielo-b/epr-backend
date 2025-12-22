import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  create(@Body() createReportDto: CreateReportDto, @CurrentUser() user: any) {
    return this.reportsService.create(createReportDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports (filtered by role and project)' })
  findAll(
    @Query('projectId') projectId: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.findAll(user.id, user.role, projectId);
  }

  @Get('statistics/project/:projectId')
  @ApiOperation({ summary: 'Get project statistics' })
  getProjectStatistics(@Param('projectId') projectId: string) {
    return this.reportsService.getProjectStatistics(projectId);
  }

  @Get('statistics/system')
  @ApiOperation({ summary: 'Get system statistics (Boss/DevOps/Superadmin only)' })
  getSystemStatistics(@CurrentUser() user: any) {
    return this.reportsService.getSystemStatistics(user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportsService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update report' })
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto, @CurrentUser() user: any) {
    return this.reportsService.update(id, updateReportDto, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete report' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportsService.remove(id, user.id, user.role);
  }
}

