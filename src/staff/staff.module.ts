import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffEntity } from './staff.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { StaffService } from './staff.service';
import { ActivityLogEntity } from '../admin/activity-log.entity';
import { IncidentEntity } from './incident.entity';
import {
  Event,
  TicketType,
  Order,
  Ticket,
} from '../tenant-admin/tenant-entity';
import { UserEntity } from '../admin/user.entity';
import { TenantUserEntity } from '../admin/tenant-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffEntity,
      IncidentEntity,
      ActivityLogEntity,
      Ticket,
      Event,
      TicketType,
      Order,
      UserEntity,
      TenantUserEntity,
    ]),
    MailerModule,
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule { }
