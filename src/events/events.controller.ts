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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new event' })
    @ApiResponse({ status: 201, description: 'Event created successfully' })
    create(@Body() createEventDto: CreateEventDto) {
        return this.eventsService.create(createEventDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all events' })
    @ApiQuery({ name: 'type', required: false, description: 'Filter by event type' })
    @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
    @ApiQuery({ name: 'parishId', required: false, description: 'Filter by parish' })
    @ApiQuery({ name: 'presbyteryId', required: false, description: 'Filter by presbytery' })
    @ApiQuery({ name: 'communityId', required: false, description: 'Filter by community' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
    @ApiResponse({ status: 200, description: 'List of all events' })
    findAll(
        @Query('type') type?: string,
        @Query('status') status?: string,
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
        @Query('communityId') communityId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.eventsService.findAll({
            type,
            status,
            parishId,
            presbyteryId,
            communityId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    @Get('upcoming')
    @ApiOperation({ summary: 'Get upcoming events' })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of events to return' })
    @ApiResponse({ status: 200, description: 'List of upcoming events' })
    getUpcoming(@Query('limit') limit?: number) {
        return this.eventsService.getUpcoming(limit ? parseInt(limit.toString()) : 10);
    }

    @Get('calendar/:year/:month')
    @ApiOperation({ summary: 'Get events calendar for a specific month' })
    @ApiQuery({ name: 'parishId', required: false, description: 'Filter by parish' })
    @ApiQuery({ name: 'presbyteryId', required: false, description: 'Filter by presbytery' })
    @ApiResponse({ status: 200, description: 'Calendar events' })
    getCalendar(
        @Param('year') year: number,
        @Param('month') month: number,
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
    ) {
        return this.eventsService.getCalendar(
            parseInt(year.toString()),
            parseInt(month.toString()),
            { parishId, presbyteryId },
        );
    }

    @Get('statistics')
    @ApiOperation({ summary: 'Get event statistics' })
    @ApiQuery({ name: 'parishId', required: false, description: 'Filter by parish' })
    @ApiQuery({ name: 'presbyteryId', required: false, description: 'Filter by presbytery' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
    @ApiResponse({ status: 200, description: 'Event statistics' })
    getStatistics(
        @Query('parishId') parishId?: string,
        @Query('presbyteryId') presbyteryId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.eventsService.getStatistics({
            parishId,
            presbyteryId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an event by ID' })
    @ApiResponse({ status: 200, description: 'Event details' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    findOne(@Param('id') id: string) {
        return this.eventsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an event' })
    @ApiResponse({ status: 200, description: 'Event updated successfully' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
        return this.eventsService.update(id, updateEventDto);
    }

    @Patch(':id/attendance')
    @ApiOperation({ summary: 'Record event attendance' })
    @ApiResponse({ status: 200, description: 'Attendance recorded successfully' })
    recordAttendance(
        @Param('id') id: string,
        @Body() attendanceData: { actualAttendees: number; notes?: string },
    ) {
        return this.eventsService.recordAttendance(id, attendanceData);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an event' })
    @ApiResponse({ status: 200, description: 'Event deleted successfully' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    remove(@Param('id') id: string) {
        return this.eventsService.remove(id);
    }
}
