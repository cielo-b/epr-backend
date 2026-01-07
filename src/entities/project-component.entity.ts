
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';

export enum ComponentType {
    FRONTEND = 'FRONTEND',
    BACKEND = 'BACKEND',
    MOBILE = 'MOBILE',
    DATABASE = 'DATABASE',
    OTHER = 'OTHER',
}

@Entity()
export class ProjectComponent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: ComponentType,
        default: ComponentType.OTHER,
    })
    type: ComponentType;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    repositoryUrl?: string;

    @Column({ nullable: true })
    productionUrl?: string;

    @Column({ nullable: true })
    stagingUrl?: string;

    // For microservices, we might want specific server details or ports
    @Column({ nullable: true })
    serverPort?: number;

    @Column({ nullable: true })
    healthCheckEndpoint?: string;

    @Column({ default: 'UNKNOWN' })
    status: string; // UP, DOWN, UNKNOWN - could use ApplicationStatus enum

    @Column({ type: 'simple-array', nullable: true })
    techStack?: string[]; // e.g. ["React", "Node.js", "PostgreSQL"]

    @ManyToOne(() => Project, (project) => project.components, { onDelete: 'CASCADE' })
    project: Project;

    @Column()
    projectId: string;

    @ManyToMany(() => User)
    @JoinTable({
        name: 'project_component_developers',
        joinColumn: { name: 'component_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'developer_id', referencedColumnName: 'id' },
    })
    developers: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
