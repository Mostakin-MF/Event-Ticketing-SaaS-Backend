// src/entities/payment.entity.ts (UPDATED with OrderEntity relation)

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity('payments')
@Index(['order_id'])
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({
    type: 'enum',
    enum: ['stripe', 'bkash', 'nagad', 'rocket', 'other'],
  })
  provider: string;

  @Column({ name: 'provider_reference', type: 'varchar', length: 255 })
  providerReference: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'amount_cents', type: 'bigint' })
  amountCents: number;

  @Column({ length: 3, default: 'BDT' })
  currency: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => OrderEntity, (order) => order.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;
}
