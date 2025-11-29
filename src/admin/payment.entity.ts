import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('payments')
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

  @Column({ name: 'provider_reference' })
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

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
