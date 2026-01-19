import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportExportService } from './import-export.service';
import { ImportExportController } from './import-export.controller';
import { Member } from '../entities/member.entity';
import { Clergy } from '../entities/clergy.entity';
import { Expense } from '../entities/expense.entity';
import { Presbytery } from '../entities/presbytery.entity';
import { Parish } from '../entities/parish.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Member, Clergy, Expense, Presbytery, Parish]),
        AuditModule
    ],
    controllers: [ImportExportController],
    providers: [ImportExportService],
    exports: [ImportExportService],
})
export class ImportExportModule { }
