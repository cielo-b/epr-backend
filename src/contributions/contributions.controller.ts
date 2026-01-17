import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { ContributionsService } from './contributions.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContributionType } from '../entities/contribution.entity';

@ApiTags('Contributions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contributions')
export class ContributionsController {
    constructor(private readonly contributionsService: ContributionsService) { }

    @Post()
    @ApiOperation({ summary: 'Record a new contribution' })
    @ApiResponse({ status: 201, description: 'Contribution recorded successfully' })
    create(@Body() createContributionDto: CreateContributionDto) {
        return this.contributionsService.create(createContributionDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all contributions' })
    @ApiQuery({ name: 'parishId', required: false })
    @ApiQuery({ name: 'presbyteryId', required: false })
    @ApiQuery({ name: 'type', required: false, enum: ContributionType })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiResponse({ status: 200, description: 'List of contributions' })
    findAll(
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
        @Query('type') type?: ContributionType,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.contributionsService.findAll({
            parishId,
            presbyteryId,
            type,
            startDate,
            endDate,
        });
    }

    @Get('summary')
    @ApiOperation({ summary: 'Get financial summary' })
    @ApiQuery({ name: 'parishId', required: false })
    @ApiQuery({ name: 'presbyteryId', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiResponse({ status: 200, description: 'Financial summary' })
    getFinancialSummary(
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.contributionsService.getFinancialSummary({
            parishId,
            presbyteryId,
            startDate,
            endDate,
        });
    }

    @Get('monthly-report/:year/:month')
    @ApiOperation({ summary: 'Get monthly contribution report' })
    @ApiQuery({ name: 'parishId', required: false })
    @ApiResponse({ status: 200, description: 'Monthly report' })
    getMonthlyReport(
        @Param('year') year: string,
        @Param('month') month: string,
        @Query('parishId') parishId?: string,
    ) {
        return this.contributionsService.getMonthlyReport(
            parseInt(year),
            parseInt(month),
            parishId,
        );
    }

    @Get('receipt/:receiptNumber')
    @ApiOperation({ summary: 'Get contribution by receipt number' })
    @ApiResponse({ status: 200, description: 'Contribution details' })
    @ApiResponse({ status: 404, description: 'Contribution not found' })
    findByReceiptNumber(@Param('receiptNumber') receiptNumber: string) {
        return this.contributionsService.findByReceiptNumber(receiptNumber);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a contribution by ID' })
    @ApiResponse({ status: 200, description: 'Contribution details' })
    @ApiResponse({ status: 404, description: 'Contribution not found' })
    findOne(@Param('id') id: string) {
        return this.contributionsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a contribution' })
    @ApiResponse({ status: 200, description: 'Contribution updated successfully' })
    update(
        @Param('id') id: string,
        @Body() updateContributionDto: UpdateContributionDto,
    ) {
        return this.contributionsService.update(id, updateContributionDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a contribution' })
    @ApiResponse({ status: 200, description: 'Contribution deleted successfully' })
    remove(@Param('id') id: string) {
        return this.contributionsService.remove(id);
    }
}
