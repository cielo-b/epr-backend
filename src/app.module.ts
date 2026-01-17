import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './entities/user.entity';
import { Notification } from './entities/notification.entity';
import { UserPermission } from './entities/user-permission.entity';
import { PermissionsModule } from './permissions/permissions.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { Conversation } from './chat/entities/conversation.entity';
import { Message } from './chat/entities/message.entity';
import { ConversationParticipant } from './chat/entities/conversation-participant.entity';
import { PushSubscription } from './entities/push-subscription.entity';

// EPR Church Management Entities
import { Presbytery } from './entities/presbytery.entity';
import { Parish } from './entities/parish.entity';
import { Community } from './entities/community.entity';
import { Member } from './entities/member.entity';
import { Clergy } from './entities/clergy.entity';
import { Sacrament } from './entities/sacrament.entity';
import { Contribution } from './entities/contribution.entity';
import { Expense } from './entities/expense.entity';
import { ChurchEvent } from './entities/event.entity';
import { PresbyteriesModule } from './presbyteries/presbyteries.module';
import { ParishesModule } from './parishes/parishes.module';
import { MembersModule } from './members/members.module';
import { ContributionsModule } from './contributions/contributions.module';
import { AdminModule } from './admin/admin.module';
import { CommunitiesModule } from './communities/communities.module';
import { EventsModule } from './events/events.module';
import { SacramentsModule } from './sacraments/sacraments.module';
import { ClergyModule } from './clergy/clergy.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { ImportExportModule } from './data/import-export.module';
import { AuditLog } from './entities/audit-log.entity';
import { Setting } from './entities/setting.entity';
import { CustomRole } from './entities/custom-role.entity';
import { RolesModule } from './roles/roles.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          User,
          Notification,
          UserPermission,
          Conversation,
          Message,
          ConversationParticipant,
          PushSubscription,
          // EPR Church Management Entities
          Presbytery,
          Parish,
          Community,
          Member,
          Clergy,
          Sacrament,
          Contribution,
          Expense,
          ChurchEvent,
          Setting,
          AuditLog,
          CustomRole,
        ],
        synchronize: true,
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    PermissionsModule,
    NotificationsModule,
    ChatModule,
    PresbyteriesModule,
    ParishesModule,
    MembersModule,
    ContributionsModule,
    AdminModule,
    CommunitiesModule,
    EventsModule,
    SacramentsModule,
    ClergyModule,
    ExpensesModule,
    SettingsModule,
    AuditModule,
    ImportExportModule,
    RolesModule,
  ],
})
export class AppModule { }

