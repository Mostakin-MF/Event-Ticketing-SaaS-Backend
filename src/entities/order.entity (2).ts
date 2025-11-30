// src/entities/order.entity.ts

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
import { TenantEntity } from '../admin/tenant.entity';
import { EventEntity } from './event.entity';
import { TicketEntity } from './ticket.entity';
import { OrderItemEntity } from './order-item.entity';
import { PaymentEntity } from '../admin/payment.entity';

@Entity('orders')
@Index(['tenant_id'])
@Index(['tenant_id', 'event_id'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({ name: 'buyer_email', type: 'varchar', length: 255 })
  buyerEmail: string;

  @Column({ name: 'buyer_name', type: 'varchar', length: 255 })
  buyerName: string;

  @Column({ name: 'total_cents', type: 'integer' })
  totalCents: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING',
  })
  status: string;

  @Column({
    name: 'payment_intent_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  paymentIntentId: string;

  @Column({
    name: 'public_lookup_token',
    type: 'varchar',
    length: 64,
    nullable: true,
    unique: true,
  })
  publicLookupToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @ManyToOne(() => EventEntity, (event) => event.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @OneToMany(() => OrderItemEntity, (item) => item.order, {
    cascade: true,
  })
  orderItems: OrderItemEntity[];

  @OneToMany(() => TicketEntity, (ticket) => ticket.order, {
    cascade: true,
  })
  tickets: TicketEntity[];

  @OneToMany(() => PaymentEntity, (payment) => payment.orderId, {
    cascade: true,
  })
  payments: PaymentEntity[];
}
