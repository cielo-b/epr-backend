import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../entities/user.entity';
import { Presbytery } from '../entities/presbytery.entity';
import { Parish } from '../entities/parish.entity';
import { Community } from '../entities/community.entity';
import { Member } from '../entities/member.entity';
import { Contribution } from '../entities/contribution.entity';
import { ChurchEvent } from '../entities/event.entity';
import { Clergy } from '../entities/clergy.entity';
import { Expense } from '../entities/expense.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Presbytery,
            Parish,
            Community,
            Member,
            Contribution,
            ChurchEvent,
            Clergy,
            Expense,
        ]),
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule { }
