import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto, BulkCreatePermissionsDto } from './dto/permission.dto';
import { UserRole } from '../entities/user.entity';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) { }

    @Get('user/:userId')
    async getUserPermissions(@Param('userId') userId: string, @Request() req) {
        // Only admins or the user themselves can view permissions
        const requestingUser = req.user;
        if (
            requestingUser.id !== userId &&
            ![UserRole.SUPERADMIN, UserRole.BOSS, UserRole.PROJECT_MANAGER].includes(requestingUser.role)
        ) {
            throw new Error('Unauthorized');
        }

        return this.permissionsService.getUserPermissions(userId);
    }

    @Post()
    async create(@Body() createDto: CreatePermissionDto, @Request() req) {
        // Only admins can create permissions
        if (![UserRole.SUPERADMIN, UserRole.BOSS, UserRole.PROJECT_MANAGER].includes(req.user.role)) {
            throw new Error('Unauthorized');
        }

        return this.permissionsService.create(createDto, req.user.id);
    }

    @Post('bulk')
    async bulkCreate(@Body() bulkDto: BulkCreatePermissionsDto, @Request() req) {
        // Only admins can create permissions
        if (![UserRole.SUPERADMIN, UserRole.BOSS, UserRole.PROJECT_MANAGER].includes(req.user.role)) {
            throw new Error('Unauthorized');
        }

        return this.permissionsService.bulkCreate(bulkDto, req.user.id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdatePermissionDto, @Request() req) {
        // Only admins can update permissions
        if (![UserRole.SUPERADMIN, UserRole.BOSS, UserRole.PROJECT_MANAGER].includes(req.user.role)) {
            throw new Error('Unauthorized');
        }

        return this.permissionsService.update(id, updateDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req) {
        // Only admins can delete permissions
        if (![UserRole.SUPERADMIN, UserRole.BOSS, UserRole.PROJECT_MANAGER].includes(req.user.role)) {
            throw new Error('Unauthorized');
        }

        await this.permissionsService.delete(id);
        return { message: 'Permission deleted successfully' };
    }

    @Delete('user/:userId')
    async deleteAllUserPermissions(@Param('userId') userId: string, @Request() req) {
        // Only admins can delete all permissions
        if (![UserRole.SUPERADMIN, UserRole.BOSS, UserRole.PROJECT_MANAGER].includes(req.user.role)) {
            throw new Error('Unauthorized');
        }

        await this.permissionsService.deleteAllUserPermissions(userId);
        return { message: 'All user permissions deleted successfully' };
    }
}
