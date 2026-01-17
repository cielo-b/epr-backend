import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Parish } from './parish.entity';
import { Community } from './community.entity';

export enum MemberStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    TRANSFERRED = 'transferred',
    DECEASED = 'deceased',
}

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
}

export enum MaritalStatus {
    SINGLE = 'single',
    MARRIED = 'married',
    WIDOWED = 'widowed',
    DIVORCED = 'divorced',
}

@Entity('members')
export class Member {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    membershipNumber: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    middleName: string;

    @Column({ type: 'date' })
    dateOfBirth: Date;

    @Column({ type: 'enum', enum: Gender })
    gender: Gender;

    @Column({ nullable: true })
    nationalId: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    sector: string;

    @Column({ nullable: true })
    cell: string;

    @Column({ nullable: true })
    village: string;

    @Column()
    parishId: string;

    @Column({ nullable: true })
    communityId: string;

    @Column({ type: 'enum', enum: MaritalStatus, default: MaritalStatus.SINGLE })
    maritalStatus: MaritalStatus;

    @Column({ nullable: true })
    spouseName: string;

    @Column({ nullable: true })
    occupation: string;

    @Column({ nullable: true })
    employer: string;

    @Column({ type: 'date', nullable: true })
    baptismDate: Date;

    @Column({ nullable: true })
    baptismParish: string;

    @Column({ type: 'date', nullable: true })
    confirmationDate: Date;

    @Column({ nullable: true })
    confirmationParish: string;

    @Column({ type: 'date', nullable: true })
    marriageDate: Date;

    @Column({ nullable: true })
    marriageParish: string;

    @Column({ type: 'date' })
    membershipDate: Date; // Date joined this parish

    @Column({ type: 'enum', enum: MemberStatus, default: MemberStatus.ACTIVE })
    status: MemberStatus;

    @Column({ nullable: true })
    transferredTo: string; // Parish ID if transferred

    @Column({ type: 'date', nullable: true })
    transferDate: Date;

    @Column({ type: 'date', nullable: true })
    deceasedDate: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ nullable: true })
    photoUrl: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relationships
    @ManyToOne(() => Parish)
    @JoinColumn({ name: 'parishId' })
    parish: Parish;

    @ManyToOne(() => Community)
    @JoinColumn({ name: 'communityId' })
    community: Community;
}
