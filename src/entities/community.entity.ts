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

@Entity('communities')
export class Community {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    code: string; // Unique community code

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    parishId: string;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    sector: string;

    @Column({ nullable: true })
    cell: string;

    @Column({ nullable: true })
    village: string;

    @Column({ nullable: true })
    leaderId: string; // Reference to User (Community Leader)

    @Column({ nullable: true })
    leaderName: string;

    @Column({ nullable: true })
    leaderPhone: string;

    @Column({ nullable: true })
    leaderEmail: string;

    @Column({ nullable: true })
    assistantLeaderId: string; // Reference to User (Assistant Community Leader)

    @Column({ nullable: true })
    assistantLeaderName: string;

    @Column({ type: 'int', default: 0 })
    totalMembers: number;

    @Column({ type: 'int', default: 0 })
    totalFamilies: number;

    @Column({ type: 'jsonb', nullable: true })
    meetingSchedule: {
        day: string;
        time: string;
        location: string;
    }[];

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relationships
    @ManyToOne(() => Parish, (parish) => parish.communities)
    @JoinColumn({ name: 'parishId' })
    parish: Parish;
}
