import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PresbyteriesService } from './presbyteries.service';
import { CreatePresbyteryDto } from './dto/create-presbytery.dto';
import { UpdatePresbyteryDto } from './dto/update-presbytery.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Presbyteries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('presbyteries')
export class PresbyteriesController {
    constructor(private readonly presbyteriesService: PresbyteriesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new presbytery' })
    @ApiResponse({ status: 201, description: 'Presbytery created successfully' })
    create(@Body() createPresbyteryDto: CreatePresbyteryDto) {
        return this.presbyteriesService.create(createPresbyteryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all presbyteries' })
    @ApiResponse({ status: 200, description: 'List of all presbyteries' })
    findAll() {
        return this.presbyteriesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a presbytery by ID' })
    @ApiResponse({ status: 200, description: 'Presbytery details' })
    @ApiResponse({ status: 404, description: 'Presbytery not found' })
    findOne(@Param('id') id: string) {
        return this.presbyteriesService.findOne(id);
    }

    @Get(':id/statistics')
    @ApiOperation({ summary: 'Get presbytery statistics' })
    @ApiResponse({ status: 200, description: 'Presbytery statistics' })
    getStatistics(@Param('id') id: string) {
        return this.presbyteriesService.getStatistics(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a presbytery' })
    @ApiResponse({ status: 200, description: 'Presbytery updated successfully' })
    @ApiResponse({ status: 404, description: 'Presbytery not found' })
    update(
        @Param('id') id: string,
        @Body() updatePresbyteryDto: UpdatePresbyteryDto,
    ) {
        return this.presbyteriesService.update(id, updatePresbyteryDto);
    }

    @Patch(':id/update-statistics')
    @ApiOperation({ summary: 'Recalculate presbytery statistics' })
    @ApiResponse({ status: 200, description: 'Statistics updated successfully' })
    updateStatistics(@Param('id') id: string) {
        return this.presbyteriesService.updateStatistics(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a presbytery' })
    @ApiResponse({ status: 200, description: 'Presbytery deleted successfully' })
    @ApiResponse({ status: 404, description: 'Presbytery not found' })
    remove(@Param('id') id: string) {
        return this.presbyteriesService.remove(id);
    }
}
