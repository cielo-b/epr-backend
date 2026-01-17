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
import { SacramentsService } from './sacraments.service';
import { CreateSacramentDto } from './dto/create-sacrament.dto';
import { UpdateSacramentDto } from './dto/update-sacrament.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Sacraments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sacraments')
export class SacramentsController {
    constructor(private readonly sacramentsService: SacramentsService) { }

    @Post()
    @ApiOperation({ summary: 'Record a new sacrament' })
    @ApiResponse({ status: 201, description: 'Sacrament recorded successfully' })
    create(@Body() createSacramentDto: CreateSacramentDto) {
        return this.sacramentsService.create(createSacramentDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all sacraments' })
    @ApiQuery({ name: 'type', required: false, description: 'Filter by sacrament type' })
    @ApiQuery({ name: 'parishId', required: false, description: 'Filter by parish' })
    @ApiQuery({ name: 'presbyteryId', required: false, description: 'Filter by presbytery' })
    @ApiQuery({ name: 'memberId', required: false, description: 'Filter by member' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
    @ApiResponse({ status: 200, description: 'List of all sacraments' })
    findAll(
        @Query('type') type?: string,
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
        @Query('memberId') memberId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.sacramentsService.findAll({
            type,
            parishId,
            presbyteryId,
            memberId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    @Get('statistics')
    @ApiOperation({ summary: 'Get sacrament statistics' })
    @ApiQuery({ name: 'parishId', required: false, description: 'Filter by parish' })
    @ApiQuery({ name: 'presbyteryId', required: false, description: 'Filter by presbytery' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
    @ApiResponse({ status: 200, description: 'Sacrament statistics' })
    getStatistics(
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.sacramentsService.getStatistics({
            parishId,
            presbyteryId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    @Get('certificate/:certificateNumber')
    @ApiOperation({ summary: 'Get a sacrament by certificate number' })
    @ApiResponse({ status: 200, description: 'Sacrament details' })
    @ApiResponse({ status: 404, description: 'Sacrament not found' })
    findByCertificateNumber(@Param('certificateNumber') certificateNumber: string) {
        return this.sacramentsService.findByCertificateNumber(certificateNumber);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a sacrament by ID' })
    @ApiResponse({ status: 200, description: 'Sacrament details' })
    @ApiResponse({ status: 404, description: 'Sacrament not found' })
    findOne(@Param('id') id: string) {
        return this.sacramentsService.findOne(id);
    }

    @Get(':id/certificate')
    @ApiOperation({ summary: 'Generate sacrament certificate (PDF)' })
    @ApiResponse({ status: 200, description: 'Certificate generated' })
    generateCertificate(@Param('id') id: string) {
        return this.sacramentsService.generateCertificate(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a sacrament record' })
    @ApiResponse({ status: 200, description: 'Sacrament updated successfully' })
    @ApiResponse({ status: 404, description: 'Sacrament not found' })
    update(
        @Param('id') id: string,
        @Body() updateSacramentDto: UpdateSacramentDto,
    ) {
        return this.sacramentsService.update(id, updateSacramentDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a sacrament record' })
    @ApiResponse({ status: 200, description: 'Sacrament deleted successfully' })
    @ApiResponse({ status: 404, description: 'Sacrament not found' })
    remove(@Param('id') id: string) {
        return this.sacramentsService.remove(id);
    }
}
