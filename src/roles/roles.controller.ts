import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CustomRole } from '../entities/custom-role.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Post()
    create(@Body() data: Partial<CustomRole>) {
        return this.rolesService.create(data);
    }

    @Get()
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: Partial<CustomRole>) {
        return this.rolesService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.rolesService.remove(id);
    }
}
