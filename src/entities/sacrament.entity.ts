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
import { Member } from './member.entity';
import { Clergy } from './clergy.entity';

export enum SacramentType {
    BAPTISM = 'baptism',
    CONFIRMATION = 'confirmation',
    MARRIAGE = 'marriage',
    HOLY_COMMUNION = 'holy_communion',
}

@Entity('sacraments')
export class Sacrament {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    certificateNumber: string;

    @Column({ type: 'enum', enum: SacramentType })
    type: SacramentType;

    @Column({ type: 'date' })
    date: Date;

    @Column()
    parishId: string;

    @Column({ nullable: true })
    memberId: string; // Primary person (baptized, confirmed, etc.)

    @Column()
    memberName: string;

    @Column({ type: 'date', nullable: true })
    memberDateOfBirth: Date;

    // For Baptism
    @Column({ nullable: true })
    fatherName: string;

    @Column({ nullable: true })
    motherName: string;

    @Column({ nullable: true })
    godparentNames: string;

    // For Marriage
    @Column({ nullable: true })
    spouseId: string; // Second person in marriage

    @Column({ nullable: true })
    spouseName: string;

    @Column({ type: 'date', nullable: true })
    spouseDateOfBirth: Date;

    @Column({ nullable: true })
    witnessNames: string;

    // For Confirmation
    @Column({ nullable: true })
    sponsorName: string;

    @Column({ nullable: true })
    baptismDate: Date;

    @Column({ nullable: true })
    baptismParish: string;

    // Officiating clergy
    @Column({ nullable: true })
    clergyId: string;

    @Column()
    clergyName: string;

    @Column({ nullable: true })
    clergyRank: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ nullable: true })
    certificateIssued: boolean;

    @Column({ type: 'date', nullable: true })
    certificateIssuedDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relationships
    @ManyToOne(() => Parish)
    @JoinColumn({ name: 'parishId' })
    parish: Parish;

    @ManyToOne(() => Member)
    @JoinColumn({ name: 'memberId' })
    member: Member;

    @ManyToOne(() => Clergy)
    @JoinColumn({ name: 'clergyId' })
    clergy: Clergy;
}
