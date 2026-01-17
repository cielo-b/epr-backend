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

export enum ClergyRank {
    BISHOP = 'bishop',
    REVEREND = 'reverend',
    PASTOR = 'pastor',
    DEACON = 'deacon',
    EVANGELIST = 'evangelist',
    CHAPLAIN = 'chaplain',
}

export enum ClergyStatus {
    ACTIVE = 'active',
    RETIRED = 'retired',
    ON_LEAVE = 'on_leave',
    TRANSFERRED = 'transferred',
    DECEASED = 'deceased',
}

@Entity('clergy')
export class Clergy {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    clergyNumber: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    middleName: string;

    @Column({ type: 'date' })
    dateOfBirth: Date;

    @Column({ nullable: true })
    nationalId: string;

    @Column()
    phone: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    address: string;

    @Column({ type: 'enum', enum: ClergyRank })
    rank: ClergyRank;

    @Column({ type: 'date' })
    ordinationDate: Date;

    @Column({ nullable: true })
    ordinationPlace: string;

    @Column({ nullable: true })
    theologicalEducation: string; // Seminary/Institution

    @Column({ type: 'date', nullable: true })
    graduationDate: Date;

    @Column({ nullable: true })
    specialization: string;

    @Column({ nullable: true })
    currentAssignment: string; // Current role/position

    @Column({ nullable: true })
    parishId: string; // Assigned parish

    @Column({ nullable: true })
    presbyteryId: string; // Assigned presbytery

    @Column({ type: 'date', nullable: true })
    assignmentDate: Date;

    @Column({ type: 'jsonb', nullable: true })
    previousAssignments: {
        position: string;
        location: string;
        startDate: string;
        endDate: string;
    }[];

    @Column({ type: 'enum', enum: ClergyStatus, default: ClergyStatus.ACTIVE })
    status: ClergyStatus;

    @Column({ nullable: true })
    spouseName: string;

    @Column({ type: 'int', default: 0 })
    numberOfChildren: number;

    @Column({ type: 'date', nullable: true })
    retirementDate: Date;

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

    @ManyToOne(() => Presbytery)
    @JoinColumn({ name: 'presbyteryId' })
    presbytery: Presbytery;
}
