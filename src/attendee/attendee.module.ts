import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendeeController } from './attendee.controller';
import { AttendeeService } from './attendee.service';
import {
  Event,
  EventSession,
  TicketType,
  DiscountCode,
  Order,
  OrderItem,
  Ticket,
} from '../tenant-admin/tenant-entity';
import { AttendeeEntity } from './attendee.entity';
import { UserEntity } from '../admin/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventSession,
      TicketType,
      DiscountCode,
      Order,
      OrderItem,
      Ticket,
      AttendeeEntity,
      UserEntity
    ]),
  ],
  controllers: [AttendeeController],
  providers: [AttendeeService],
  exports: [AttendeeService],
})
export class AttendeeModule { }
