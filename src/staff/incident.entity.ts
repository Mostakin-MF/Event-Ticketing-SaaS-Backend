import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '../admin/tenant.entity';
import { StaffEntity } from './staff.entity';

@Entity('incidents')
export class IncidentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id', type: 'uuid' })
    tenantId: string;

    @Column({ name: 'staff_id', type: 'uuid' })
    staffId: string;

    @Column({ name: 'resolved_by_staff_id', type: 'uuid', nullable: true })
    resolvedByStaffId: string | null;

    @Column({
        type: 'enum',
        enumName: 'incidents_type_enum',
        enum: ['ISSUE', 'SECURITY', 'MEDICAL', 'LOST_ITEM'],
        nullable: true
    })
    type: string; // e.g. "ISSUE", "SECURITY", "MEDICAL", "LOST_ITEM"

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 50, default: 'OPEN' })
    status: string; // e.g. "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"

    @Column({ type: 'text', nullable: true })
    resolutionNotes: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    resolutionType: string | null; // e.g. "FIXED", "ESCALATED", "DEFERRED"

    @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    /**
     * Relations
     */

    @ManyToOne(() => TenantEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: TenantEntity;

    @ManyToOne(() => StaffEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'staff_id' })
    staff: StaffEntity;

    @ManyToOne(() => StaffEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'resolved_by_staff_id' })
    resolvedByStaff: StaffEntity | null;
}
