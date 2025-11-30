// src/entities/ticket-type.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { TicketEntity } from './ticket.entity';
import { OrderItemEntity } from './order-item.entity';

@Entity('ticket_types')
@Index(['event_id'])
export class TicketTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'price_cents', type: 'integer' })
  priceCents: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ name: 'quantity_total', type: 'integer' })
  quantityTotal: number;

  @Column({ name: 'quantity_sold', type: 'integer', default: 0 })
  quantitySold: number;

  @Column({ name: 'sales_start', type: 'timestamp', nullable: true })
  salesStart: Date;

  @Column({ name: 'sales_end', type: 'timestamp', nullable: true })
  salesEnd: Date;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE', 'HIDDEN'],
    default: 'ACTIVE',
  })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => EventEntity, (event) => event.ticketTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @OneToMany(() => TicketEntity, (ticket) => ticket.ticketType)
  tickets: TicketEntity[];

  @OneToMany(() => OrderItemEntity, (item) => item.ticketType)
  orderItems: OrderItemEntity[];
}
