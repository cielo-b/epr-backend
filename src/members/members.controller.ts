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
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MemberStatus } from '../entities/member.entity';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembersController {
    constructor(private readonly membersService: MembersService) { }

    @Post()
    @ApiOperation({ summary: 'Register a new member' })
    @ApiResponse({ status: 201, description: 'Member registered successfully' })
    create(@Body() createMemberDto: CreateMemberDto, @CurrentUser() user: any) {
        return this.membersService.create(createMemberDto, user);
    }

    @Get()
    @ApiOperation({ summary: 'Get all members' })
    @ApiQuery({ name: 'parishId', required: false })
    @ApiQuery({ name: 'communityId', required: false })
    @ApiQuery({ name: 'status', required: false, enum: MemberStatus })
    @ApiResponse({ status: 200, description: 'List of members' })
    findAll(
        @Query('parishId') parishId?: string,
        @Query('communityId') communityId?: string,
        @Query('status') status?: MemberStatus,
        @CurrentUser() user?: any,
    ) {
        return this.membersService.findAll({ parishId, communityId, status }, user);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search members' })
    @ApiQuery({ name: 'q', required: true })
    @ApiResponse({ status: 200, description: 'Search results' })
    search(@Query('q') query: string, @CurrentUser() user?: any) {
        return this.membersService.search(query, user);
    }

    @Get('statistics/parish/:parishId')
    @ApiOperation({ summary: 'Get member statistics by parish' })
    @ApiResponse({ status: 200, description: 'Parish member statistics' })
    getStatisticsByParish(@Param('parishId') parishId: string) {
        return this.membersService.getStatisticsByParish(parishId);
    }

    @Get('membership/:membershipNumber')
    @ApiOperation({ summary: 'Get member by membership number' })
    @ApiResponse({ status: 200, description: 'Member details' })
    @ApiResponse({ status: 404, description: 'Member not found' })
    findByMembershipNumber(@Param('membershipNumber') membershipNumber: string) {
        return this.membersService.findByMembershipNumber(membershipNumber);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a member by ID' })
    @ApiResponse({ status: 200, description: 'Member details' })
    @ApiResponse({ status: 404, description: 'Member not found' })
    findOne(@Param('id') id: string, @CurrentUser() user?: any) {
        return this.membersService.findOne(id, user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a member' })
    @ApiResponse({ status: 200, description: 'Member updated successfully' })
    update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto, @CurrentUser() user?: any) {
        return this.membersService.update(id, updateMemberDto, user);
    }

    @Patch(':id/transfer')
    @ApiOperation({ summary: 'Transfer member to another parish' })
    @ApiResponse({ status: 200, description: 'Member transferred successfully' })
    transferMember(
        @Param('id') id: string,
        @Body() body: { newParishId: string; newCommunityId?: string },
        @CurrentUser() user?: any,
    ) {
        return this.membersService.transferMember(
            id,
            body.newParishId,
            body.newCommunityId,
            user,
        );
    }

    @Patch(':id/mark-deceased')
    @ApiOperation({ summary: 'Mark member as deceased' })
    @ApiResponse({ status: 200, description: 'Member marked as deceased' })
    markAsDeceased(
        @Param('id') id: string,
        @Body() body: { deceasedDate: string },
        @CurrentUser() user?: any,
    ) {
        return this.membersService.markAsDeceased(id, new Date(body.deceasedDate), user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a member' })
    @ApiResponse({ status: 200, description: 'Member deleted successfully' })
    remove(@Param('id') id: string, @CurrentUser() user?: any) {
        return this.membersService.remove(id, user);
    }
}
