import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../admin/user.entity';

@Entity('attendees')
export class AttendeeEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    userId: string;

    @OneToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    dateOfBirth: string;

    @Column({ nullable: true })
    gender: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    city: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
