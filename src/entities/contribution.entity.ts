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
import { Presbytery } from './presbytery.entity';
import { Member } from './member.entity';

export enum ContributionType {
    TITHE = 'tithe',
    OFFERING = 'offering',
    SPECIAL_OFFERING = 'special_offering',
    BUILDING_FUND = 'building_fund',
    MISSION_FUND = 'mission_fund',
    THANKSGIVING = 'thanksgiving',
    PLEDGE = 'pledge',
    OTHER = 'other',
}

export enum PaymentMethod {
    CASH = 'cash',
    MOBILE_MONEY = 'mobile_money',
    BANK_TRANSFER = 'bank_transfer',
    CHECK = 'check',
}

@Entity('contributions')
export class Contribution {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    receiptNumber: string;

    @Column({ type: 'enum', enum: ContributionType })
    type: ContributionType;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column({ type: 'date' })
    date: Date;

    @Column({ nullable: true })
    parishId: string;

    @Column({ nullable: true })
    presbyteryId: string;

    @Column({ nullable: true })
    memberId: string;

    @Column({ nullable: true })
    contributorName: string;

    @Column({ nullable: true })
    contributorPhone: string;

    @Column({ type: 'enum', enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @Column({ nullable: true })
    transactionReference: string;

    @Column({ nullable: true })
    purpose: string; // Specific purpose or project

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ default: false })
    isAnonymous: boolean;

    @Column({ nullable: true })
    collectedBy: string; // User ID of collector

    @Column({ nullable: true })
    collectorName: string;

    @Column({ default: true })
    receiptIssued: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relationships
    @ManyToOne(() => Parish)
    @JoinColumn({ name: 'parishId' })
    parish: Parish;

    @ManyToOne(() => Presbytery)
    @JoinColumn({ name: 'presbyteryId' })
    presbytery: Presbytery;

    @ManyToOne(() => Member)
    @JoinColumn({ name: 'memberId' })
    member: Member;
}
