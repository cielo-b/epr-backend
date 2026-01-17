import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all system settings' })
    @ApiResponse({ status: 200, description: 'List of all settings' })
    findAll() {
        return this.settingsService.findAll();
    }

    @Get('group/:group')
    @ApiOperation({ summary: 'Get settings by group' })
    @ApiResponse({ status: 200, description: 'Settings in group' })
    findByGroup(@Param('group') group: string) {
        return this.settingsService.getByGroup(group);
    }

    @Get(':key')
    @ApiOperation({ summary: 'Get a setting by key' })
    @ApiResponse({ status: 200, description: 'Setting value' })
    findByKey(@Param('key') key: string) {
        return this.settingsService.findByKey(key);
    }

    @Post()
    @ApiOperation({ summary: 'Update system settings in bulk' })
    @ApiResponse({ status: 200, description: 'Settings updated successfully' })
    updateBulk(@Body() settings: Record<string, any>) {
        return this.settingsService.updateBulk(settings);
    }

    @Post('initialize')
    @ApiOperation({ summary: 'Initialize default settings' })
    @ApiResponse({ status: 200, description: 'Defaults initialized' })
    initialize() {
        return this.settingsService.initializeDefaults();
    }
}
