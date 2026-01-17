import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClergyService } from './clergy.service';
import { ClergyController } from './clergy.controller';
import { Clergy } from '../entities/clergy.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Clergy])],
    controllers: [ClergyController],
    providers: [ClergyService],
    exports: [ClergyService],
})
export class ClergyModule { }
