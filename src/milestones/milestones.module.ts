import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilestonesService } from './milestones.service';
import { MilestonesController } from './milestones.controller';
import { Milestone } from '../entities/milestone.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Milestone])],
    controllers: [MilestonesController],
    providers: [MilestonesService],
    exports: [MilestonesService],
})
export class MilestonesModule { }
