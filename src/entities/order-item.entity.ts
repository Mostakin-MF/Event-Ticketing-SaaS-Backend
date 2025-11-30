// src/entities/order-item.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { TicketTypeEntity } from './ticket-type.entity';

@Entity('order_items')
@Index(['order_id'])
@Index(['ticket_type_id'])
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'ticket_type_id', type: 'uuid' })
  ticketTypeId: string;

  @Column({ name: 'unit_price_cents', type: 'integer' })
  unitPriceCents: number;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'subtotal_cents', type: 'integer' })
  subtotalCents: number;

  // Relations
  @ManyToOne(() => OrderEntity, (order) => order.orderItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @ManyToOne(() => TicketTypeEntity, (ticketType) => ticketType.orderItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketTypeEntity;
}
