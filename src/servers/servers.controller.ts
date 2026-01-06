import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('servers')
@Controller('servers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServersController {
    constructor(private readonly serversService: ServersService) { }

    private checkDevOpsRole(role: UserRole) {
        if (role !== UserRole.DEVOPS && role !== UserRole.BOSS && role !== UserRole.SUPERADMIN && role !== UserRole.PROJECT_MANAGER) {
            throw new ForbiddenException('Only DevOps, Boss, Superadmin, or Project Manager can manage servers');
        }
    }

    @Post()
    create(@Body() createServerDto: CreateServerDto, @CurrentUser() user: any) {
        this.checkDevOpsRole(user.role);
        return this.serversService.create(createServerDto);
    }

    @Get()
    findAll(@CurrentUser() user: any) {
        this.checkDevOpsRole(user.role);
        return this.serversService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        this.checkDevOpsRole(user.role);
        return this.serversService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateServerDto: UpdateServerDto, @CurrentUser() user: any) {
        this.checkDevOpsRole(user.role);
        return this.serversService.update(id, updateServerDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        this.checkDevOpsRole(user.role);
        return this.serversService.remove(id);
    }
}
