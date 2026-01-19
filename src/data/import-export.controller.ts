import { Controller, Post, Get, Body, UseInterceptors, UploadedFile, Param, Res, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ImportExportService } from './import-export.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('Data Import/Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('data')
export class ImportExportController {
    constructor(private readonly dataService: ImportExportService) { }

    @Post('import/:module')
    @ApiOperation({ summary: 'Import data from Excel' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async importData(
        @Param('module') module: 'members' | 'clergy' | 'expenses' | 'presbyteries' | 'parishes',
        @UploadedFile() file: Express.Multer.File,
        @GetUser() user: User
    ) {
        return this.dataService.importFromExcel(file.buffer, module, user.id);
    }

    @Get('template/:module')
    @ApiOperation({ summary: 'Get Excel template for a module' })
    async getTemplate(@Param('module') module: string, @Res() res: Response) {
        let headers = [];
        if (module === 'members') {
            headers = ['membershipNumber', 'firstName', 'lastName', 'gender', 'phone', 'email', 'dateOfBirth'];
        } else if (module === 'clergy') {
            headers = ['clergyNumber', 'firstName', 'lastName', 'rank', 'phone', 'email', 'ordinationDate'];
        } else if (module === 'expenses') {
            headers = ['voucherNumber', 'category', 'description', 'amount', 'payeeName', 'date'];
        } else if (module === 'presbyteries') {
            headers = ['name', 'description', 'location', 'region', 'leaderName', 'leaderPhone', 'leaderEmail', 'officeAddress', 'officePhone', 'officeEmail'];
        } else if (module === 'parishes') {
            headers = ['name', 'code', 'description', 'presbyteryId', 'location', 'district', 'sector', 'pastorName', 'pastorEmail', 'pastorPhone', 'administratorName', 'churchAddress', 'churchPhone', 'churchEmail', 'foundedDate'];
        }

        const templateData = [headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {})];
        const buffer = await this.dataService.exportToExcel(templateData, `${module}_template`);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=${module}_template.xlsx`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }

    @Get('export/pdf/:module')
    @ApiOperation({ summary: 'Export module data to PDF' })
    async exportPDF(@Param('module') module: string, @Res() res: Response) {
        // This is a simplified fetch - in a real app, you'd use the respective services
        // but for Phase 3 implementation, we'll implement it here or call a service method
        const buffer = await this.dataService.generatePDF([], `${module.toUpperCase()} Report`); // Temporary empty data

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${module}_report.pdf`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
}
