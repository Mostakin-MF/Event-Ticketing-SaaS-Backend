// src/entities/discount-code.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EventEntity } from './event.entity';

@Entity('discount_codes')
@Index(['event_id'])
@Index(['code'])
export class DiscountCodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'max_redemptions', type: 'integer', nullable: true })
  maxRedemptions: number;

  @Column({ name: 'times_redeemed', type: 'integer', default: 0 })
  timesRedeemed: number;

  @Column({
    type: 'enum',
    enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
  })
  discountType: string;

  @Column({ name: 'discount_value', type: 'integer' })
  discountValue: number;

  @Column({ name: 'starts_at', type: 'timestamp', nullable: true })
  startsAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
    default: 'ACTIVE',
  })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => EventEntity, (event) => event.discountCodes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;
}
