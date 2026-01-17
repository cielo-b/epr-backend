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

export enum EventType {
    WORSHIP_SERVICE = 'worship_service',
    PRAYER_MEETING = 'prayer_meeting',
    BIBLE_STUDY = 'bible_study',
    YOUTH_MEETING = 'youth_meeting',
    WOMENS_FELLOWSHIP = 'womens_fellowship',
    MENS_FELLOWSHIP = 'mens_fellowship',
    CHOIR_PRACTICE = 'choir_practice',
    CONFERENCE = 'conference',
    RETREAT = 'retreat',
    SEMINAR = 'seminar',
    OUTREACH = 'outreach',
    SYNOD_MEETING = 'synod_meeting',
    PRESBYTERY_MEETING = 'presbytery_meeting',
    PARISH_COUNCIL = 'parish_council',
    SPECIAL_SERVICE = 'special_service',
    OTHER = 'other',
}

export enum EventStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    POSTPONED = 'postponed',
}

@Entity('events')
export class ChurchEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'enum', enum: EventType })
    type: EventType;

    @Column({ type: 'timestamp' })
    startDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    venue: string;

    @Column({ nullable: true })
    parishId: string;

    @Column({ nullable: true })
    presbyteryId: string;

    @Column({ nullable: true })
    communityId: string;

    @Column({ default: false })
    isGeneralSynod: boolean; // True if it's a General Synod level event

    @Column({ nullable: true })
    organizerId: string; // User ID

    @Column({ nullable: true })
    organizerName: string;

    @Column({ nullable: true })
    organizerContact: string;

    @Column({ nullable: true })
    speakerName: string;

    @Column({ nullable: true })
    speakerTitle: string;

    @Column({ type: 'int', default: 0 })
    expectedAttendance: number;

    @Column({ type: 'int', default: 0 })
    actualAttendance: number;

    @Column({ type: 'int', default: 0 })
    actualAttendees: number; // Alias for actualAttendance

    @Column({ type: 'int', default: 0 })
    expectedAttendees: number; // Alias for expectedAttendance

    @Column({ type: 'enum', enum: EventStatus, default: EventStatus.SCHEDULED })
    status: EventStatus;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    budget: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    actualCost: number;

    @Column({ type: 'text', nullable: true })
    agenda: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ nullable: true })
    posterUrl: string;

    @Column({ default: false })
    requiresRegistration: boolean;

    @Column({ type: 'int', default: 0 })
    registrationCount: number;

    @Column({ default: false })
    isRecurring: boolean;

    @Column({ nullable: true })
    recurrencePattern: string;

    @Column({ type: 'jsonb', nullable: true })
    speakers: string[];

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
