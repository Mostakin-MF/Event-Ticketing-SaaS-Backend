// src/entities/ticket.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { OrderEntity } from './order.entity';
import { TicketTypeEntity } from '../entities/ticket-type.entity';

export type TicketStatus = 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'USED';

@Entity('tickets')
@Index(['orderId'])
@Index(['ticketTypeId'])
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'ticket_type_id', type: 'uuid' })
  ticketTypeId: string;

  @Column({ name: 'attendee_name', type: 'varchar', length: 255 })
  attendeeName: string;

  @Column({ name: 'attendee_email', type: 'varchar', length: 255, nullable: true })
  attendeeEmail: string | null;

  @Column({ name: 'qr_code_payload', type: 'text' })
  qrCodePayload: string;

  @Column({ name: 'qr_signature', type: 'text', nullable: true })
  qrSignature: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ACTIVE',
  })
  status: TicketStatus;

  @Column({ name: 'checked_in_at', type: 'timestamp', nullable: true })
  checkedInAt: Date | null;

  @Column({ name: 'seat_label', type: 'varchar', length: 50, nullable: true })
  seatLabel: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Relations
   */

  @ManyToOne(() => OrderEntity, (order) => order.tickets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @ManyToOne(() => TicketTypeEntity, (ticketType) => ticketType.tickets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketTypeEntity;
}
