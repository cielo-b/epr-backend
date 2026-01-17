import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string;

    @Column({ type: 'text', nullable: true })
    value: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: 'string' })
    type: 'string' | 'number' | 'boolean' | 'json';

    @Column({ nullable: true })
    group: string; // e.g., 'CHURCH_INFO', 'FINANCIAL', 'SYSTEM'

    @UpdateDateColumn()
    updatedAt: Date;
}
