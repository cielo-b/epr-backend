import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum ServerType {
    DEVELOPMENT = 'DEVELOPMENT',
    PRODUCTION = 'PRODUCTION',
    DATABASE = 'DATABASE',
    STAGING = 'STAGING',
    OTHER = 'OTHER',
}

export enum ServerStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
}

@Entity()
export class Server {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    ipAddress: string;

    @Column({ nullable: true })
    port: number;

    @Column({ nullable: true })
    username: string;

    @Column({
        type: 'enum',
        enum: ServerType,
        default: ServerType.OTHER,
    })
    type: ServerType;

    @Column({
        type: 'enum',
        enum: ServerStatus,
        default: ServerStatus.ACTIVE,
    })
    status: ServerStatus;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ nullable: true })
    sshKeyPath?: string;

    @Column({ nullable: true })
    monitoringUrl?: string;

    @Column({ nullable: true })
    cpuCores?: number;

    @Column({ nullable: true })
    ramGB?: number;

    @Column({ nullable: true })
    diskGB?: number;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
