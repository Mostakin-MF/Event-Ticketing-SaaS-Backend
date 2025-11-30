// src/entities/event.entity.ts

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
import { TenantEntity } from './tenant.entity';
import { TicketTypeEntity } from './ticket-type.entity';
import { OrderEntity } from './order.entity';
import { EventSessionEntity } from './event-session.entity';
import { DiscountCodeEntity } from './discount-code.entity';

@Entity('events')
@Index(['tenant_id', 'slug'], { unique: true })
@Index(['tenant_id'])
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  venue: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ name: 'start_at', type: 'timestamp' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamp' })
  endAt: Date;

  @Column({ type: 'varchar', length: 50, default: 'DRAFT' })
  status: string;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ name: 'hero_image_url', type: 'varchar', length: 512, nullable: true })
  heroImageUrl: string;

  @Column({ name: 'seo_meta', type: 'jsonb', nullable: true })
  seoMeta: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @OneToMany(() => TicketTypeEntity, (ticketType) => ticketType.event)
  ticketTypes: TicketTypeEntity[];

  @OneToMany(() => OrderEntity, (order) => order.event)
  orders: OrderEntity[];

  @OneToMany(() => EventSessionEntity, (session) => session.event)
  sessions: EventSessionEntity[];

  @OneToMany(() => DiscountCodeEntity, (discountCode) => discountCode.event)
  discountCodes: DiscountCodeEntity[];
}
