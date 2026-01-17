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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ParishesService } from './parishes.service';
import { CreateParishDto } from './dto/create-parish.dto';
import { UpdateParishDto } from './dto/update-parish.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Parishes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parishes')
export class ParishesController {
    constructor(private readonly parishesService: ParishesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new parish' })
    @ApiResponse({ status: 201, description: 'Parish created successfully' })
    create(@Body() createParishDto: CreateParishDto) {
        return this.parishesService.create(createParishDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all parishes' })
    @ApiQuery({ name: 'presbyteryId', required: false, description: 'Filter by presbytery ID' })
    @ApiResponse({ status: 200, description: 'List of all parishes' })
    findAll(@Query('presbyteryId') presbyteryId?: string) {
        return this.parishesService.findAll(presbyteryId);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search parishes' })
    @ApiQuery({ name: 'q', required: true, description: 'Search query' })
    @ApiResponse({ status: 200, description: 'Search results' })
    search(@Query('q') query: string) {
        return this.parishesService.search(query);
    }

    @Get('code/:code')
    @ApiOperation({ summary: 'Get a parish by code' })
    @ApiResponse({ status: 200, description: 'Parish details' })
    @ApiResponse({ status: 404, description: 'Parish not found' })
    findByCode(@Param('code') code: string) {
        return this.parishesService.findByCode(code);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a parish by ID' })
    @ApiResponse({ status: 200, description: 'Parish details' })
    @ApiResponse({ status: 404, description: 'Parish not found' })
    findOne(@Param('id') id: string) {
        return this.parishesService.findOne(id);
    }

    @Get(':id/statistics')
    @ApiOperation({ summary: 'Get parish statistics' })
    @ApiResponse({ status: 200, description: 'Parish statistics' })
    getStatistics(@Param('id') id: string) {
        return this.parishesService.getStatistics(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a parish' })
    @ApiResponse({ status: 200, description: 'Parish updated successfully' })
    @ApiResponse({ status: 404, description: 'Parish not found' })
    update(@Param('id') id: string, @Body() updateParishDto: UpdateParishDto) {
        return this.parishesService.update(id, updateParishDto);
    }

    @Patch(':id/update-statistics')
    @ApiOperation({ summary: 'Recalculate parish statistics' })
    @ApiResponse({ status: 200, description: 'Statistics updated successfully' })
    updateStatistics(@Param('id') id: string) {
        return this.parishesService.updateStatistics(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a parish' })
    @ApiResponse({ status: 200, description: 'Parish deleted successfully' })
    @ApiResponse({ status: 404, description: 'Parish not found' })
    remove(@Param('id') id: string) {
        return this.parishesService.remove(id);
    }
}
