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
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Communities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('communities')
export class CommunitiesController {
    constructor(private readonly communitiesService: CommunitiesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new community' })
    @ApiResponse({ status: 201, description: 'Community created successfully' })
    create(@Body() createCommunityDto: CreateCommunityDto) {
        return this.communitiesService.create(createCommunityDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all communities' })
    @ApiQuery({ name: 'parishId', required: false, description: 'Filter by parish ID' })
    @ApiQuery({ name: 'presbyteryId', required: false, description: 'Filter by presbytery ID' })
    @ApiResponse({ status: 200, description: 'List of all communities' })
    findAll(
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
    ) {
        return this.communitiesService.findAll({ parishId, presbyteryId });
    }

    @Get('search')
    @ApiOperation({ summary: 'Search communities' })
    @ApiQuery({ name: 'q', required: true, description: 'Search query' })
    @ApiResponse({ status: 200, description: 'Search results' })
    search(@Query('q') query: string) {
        return this.communitiesService.search(query);
    }

    @Get('code/:code')
    @ApiOperation({ summary: 'Get a community by code' })
    @ApiResponse({ status: 200, description: 'Community details' })
    @ApiResponse({ status: 404, description: 'Community not found' })
    findByCode(@Param('code') code: string) {
        return this.communitiesService.findByCode(code);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a community by ID' })
    @ApiResponse({ status: 200, description: 'Community details' })
    @ApiResponse({ status: 404, description: 'Community not found' })
    findOne(@Param('id') id: string) {
        return this.communitiesService.findOne(id);
    }

    @Get(':id/statistics')
    @ApiOperation({ summary: 'Get community statistics' })
    @ApiResponse({ status: 200, description: 'Community statistics' })
    getStatistics(@Param('id') id: string) {
        return this.communitiesService.getStatistics(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a community' })
    @ApiResponse({ status: 200, description: 'Community updated successfully' })
    @ApiResponse({ status: 404, description: 'Community not found' })
    update(
        @Param('id') id: string,
        @Body() updateCommunityDto: UpdateCommunityDto,
    ) {
        return this.communitiesService.update(id, updateCommunityDto);
    }

    @Patch(':id/update-statistics')
    @ApiOperation({ summary: 'Recalculate community statistics' })
    @ApiResponse({ status: 200, description: 'Statistics updated successfully' })
    updateStatistics(@Param('id') id: string) {
        return this.communitiesService.updateStatistics(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a community' })
    @ApiResponse({ status: 200, description: 'Community deleted successfully' })
    @ApiResponse({ status: 404, description: 'Community not found' })
    remove(@Param('id') id: string) {
        return this.communitiesService.remove(id);
    }
}
