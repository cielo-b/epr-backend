import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Presbytery } from './presbytery.entity';
import { Community } from './community.entity';

@Entity('parishes')
export class Parish {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    code: string; // Unique parish code

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    presbyteryId: string;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    district: string;

    @Column({ nullable: true })
    sector: string;

    @Column({ nullable: true })
    pastorId: string; // Reference to User (Pastor)

    @Column({ nullable: true })
    pastorName: string;

    @Column({ nullable: true })
    pastorEmail: string;

    @Column({ nullable: true })
    pastorPhone: string;

    @Column({ nullable: true })
    administratorId: string; // Reference to User

    @Column({ nullable: true })
    administratorName: string;

    @Column({ nullable: true })
    churchAddress: string;

    @Column({ nullable: true })
    churchPhone: string;

    @Column({ nullable: true })
    churchEmail: string;

    @Column({ type: 'date', nullable: true })
    foundedDate: Date;

    @Column({ type: 'int', default: 0 })
    totalMembers: number;

    @Column({ type: 'int', default: 0 })
    totalCommunities: number;

    @Column({ type: 'int', default: 0 })
    totalBaptisms: number;

    @Column({ type: 'int', default: 0 })
    totalConfirmations: number;

    @Column({ type: 'int', default: 0 })
    totalMarriages: number;

    @Column({ type: 'jsonb', nullable: true })
    serviceSchedule: {
        day: string;
        time: string;
        type: string;
    }[];

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relationships
    @ManyToOne(() => Presbytery, (presbytery) => presbytery.parishes)
    @JoinColumn({ name: 'presbyteryId' })
    presbytery: Presbytery;

    @OneToMany(() => Community, (community) => community.parish)
    communities: Community[];
}
