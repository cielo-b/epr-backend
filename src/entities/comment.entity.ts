import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Document } from './document.entity';

@Entity()
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    authorId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    author: User;

    @Column({ nullable: true })
    projectId?: string;

    @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
    project?: Project;

    @Column({ nullable: true })
    documentId?: string;

    @ManyToOne(() => Document, { onDelete: 'CASCADE', nullable: true })
    document?: Document;
}
