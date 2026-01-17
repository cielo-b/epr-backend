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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClergyService } from './clergy.service';
import { CreateClergyDto } from './dto/create-clergy.dto';
import { UpdateClergyDto } from './dto/update-clergy.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClergyRank, ClergyStatus } from '../entities/clergy.entity';

@ApiTags('Clergy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clergy')
export class ClergyController {
    constructor(private readonly clergyService: ClergyService) { }

    @Post()
    @ApiOperation({ summary: 'Register a new clergy member' })
    @ApiResponse({ status: 201, description: 'Clergy member registered successfully' })
    create(@Body() createClergyDto: CreateClergyDto, @CurrentUser() user: any) {
        return this.clergyService.create(createClergyDto, user);
    }

    @Get()
    @ApiOperation({ summary: 'Get all clergy members' })
    @ApiQuery({ name: 'parishId', required: false })
    @ApiQuery({ name: 'presbyteryId', required: false })
    @ApiQuery({ name: 'rank', required: false, enum: ClergyRank })
    @ApiQuery({ name: 'status', required: false, enum: ClergyStatus })
    @ApiResponse({ status: 200, description: 'List of clergy members' })
    findAll(
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
        @Query('rank') rank?: ClergyRank,
        @Query('status') status?: ClergyStatus,
        @CurrentUser() user?: any,
    ) {
        return this.clergyService.findAll({ parishId, presbyteryId, rank, status }, user);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search clergy members' })
    @ApiQuery({ name: 'q', required: true })
    @ApiResponse({ status: 200, description: 'Search results' })
    search(@Query('q') query: string, @CurrentUser() user?: any) {
        return this.clergyService.search(query, user);
    }

    @Get('statistics')
    @ApiOperation({ summary: 'Get clergy statistics' })
    @ApiResponse({ status: 200, description: 'Statistics summary' })
    getStatistics() {
        return this.clergyService.getStatistics();
    }

    @Get('number/:clergyNumber')
    @ApiOperation({ summary: 'Get clergy member by clergy number' })
    @ApiResponse({ status: 200, description: 'Clergy details' })
    @ApiResponse({ status: 404, description: 'Not found' })
    findByClergyNumber(@Param('clergyNumber') clergyNumber: string) {
        return this.clergyService.findByClergyNumber(clergyNumber);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a clergy member by ID' })
    @ApiResponse({ status: 200, description: 'Clergy details' })
    @ApiResponse({ status: 404, description: 'Not found' })
    findOne(@Param('id') id: string, @CurrentUser() user?: any) {
        return this.clergyService.findOne(id, user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a clergy member record' })
    @ApiResponse({ status: 200, description: 'Updated successfully' })
    update(@Param('id') id: string, @Body() updateClergyDto: UpdateClergyDto, @CurrentUser() user?: any) {
        return this.clergyService.update(id, updateClergyDto, user);
    }

    @Patch(':id/transfer')
    @ApiOperation({ summary: 'Register a clergy transfer' })
    @ApiResponse({ status: 200, description: 'Transfer registered successfully' })
    registerTransfer(
        @Param('id') id: string,
        @Body() transferData: {
            newParishId?: string;
            newPresbyteryId?: string;
            newAssignment: string;
            transferDate: string;
        },
        @CurrentUser() user?: any,
    ) {
        return this.clergyService.registerTransfer(id, transferData, user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete a clergy member record' })
    @ApiResponse({ status: 200, description: 'Resource deactivated successfully' })
    remove(@Param('id') id: string, @CurrentUser() user?: any) {
        return this.clergyService.remove(id, user);
    }
}
