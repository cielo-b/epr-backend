import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Parish } from './parish.entity';

@Entity('presbyteries')
export class Presbytery {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    region: string;

    @Column({ nullable: true })
    leaderId: string; // Reference to User (Presbytery Leader)

    @Column({ nullable: true })
    leaderName: string;

    @Column({ nullable: true })
    leaderEmail: string;

    @Column({ nullable: true })
    leaderPhone: string;

    @Column({ nullable: true })
    officeAddress: string;

    @Column({ nullable: true })
    officePhone: string;

    @Column({ nullable: true })
    officeEmail: string;

    @Column({ type: 'int', default: 0 })
    totalParishes: number;

    @Column({ type: 'int', default: 0 })
    totalMembers: number;

    @Column({ type: 'int', default: 0 })
    totalCommunities: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relationships
    @OneToMany(() => Parish, (parish) => parish.presbytery)
    parishes: Parish[];
}
