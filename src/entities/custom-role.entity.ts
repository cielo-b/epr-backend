import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

export enum RoleLevel {
    SYNOD = 'SYNOD',
    PRESBYTERY = 'PRESBYTERY',
    PARISH = 'PARISH',
    COMMUNITY = 'COMMUNITY',
}

@Entity('custom_roles')
export class CustomRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: RoleLevel,
        default: RoleLevel.SYNOD,
    })
    level: RoleLevel;

    // The ID of the specific presbytery, parish, etc. if restricted to one
    @Column({ nullable: true })
    targetId: string;

    @Column({ type: 'json' })
    permissions: Array<{
        resource: string;
        actions: string[]; // ['VIEW', 'CREATE', etc.]
    }>;

    @OneToMany(() => User, (user) => user.customRole)
    users: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
