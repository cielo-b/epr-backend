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

export enum ExpenseCategory {
    SALARIES = 'salaries',
    UTILITIES = 'utilities',
    MAINTENANCE = 'maintenance',
    SUPPLIES = 'supplies',
    PROGRAMS = 'programs',
    MISSIONS = 'missions',
    CONSTRUCTION = 'construction',
    EQUIPMENT = 'equipment',
    TRANSPORTATION = 'transportation',
    COMMUNICATION = 'communication',
    TRAINING = 'training',
    WELFARE = 'welfare',
    OTHER = 'other',
}

export enum ExpenseStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    PAID = 'paid',
    REJECTED = 'rejected',
}

@Entity('expenses')
export class Expense {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    voucherNumber: string;

    @Column({ type: 'enum', enum: ExpenseCategory })
    category: ExpenseCategory;

    @Column()
    description: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column({ type: 'date' })
    date: Date;

    @Column({ nullable: true })
    parishId: string;

    @Column({ nullable: true })
    presbyteryId: string;

    @Column({ nullable: true })
    payeeName: string;

    @Column({ nullable: true })
    payeePhone: string;

    @Column({ nullable: true })
    payeeAccount: string;

    @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING })
    status: ExpenseStatus;

    @Column({ nullable: true })
    requestedBy: string; // User ID

    @Column({ nullable: true })
    requestedByName: string;

    @Column({ nullable: true })
    approvedBy: string; // User ID

    @Column({ nullable: true })
    approvedByName: string;

    @Column({ type: 'date', nullable: true })
    approvedDate: Date;

    @Column({ nullable: true })
    paidBy: string; // User ID

    @Column({ nullable: true })
    paidByName: string;

    @Column({ type: 'date', nullable: true })
    paidDate: Date;

    @Column({ nullable: true })
    paymentMethod: string;

    @Column({ nullable: true })
    transactionReference: string;

    @Column({ nullable: true })
    receiptUrl: string; // Uploaded receipt/invoice

    @Column({ type: 'text', nullable: true })
    notes: string;

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
}
