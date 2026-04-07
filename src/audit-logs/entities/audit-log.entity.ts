import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: false })
  actor: User;

  @Column()
  actionType: string;

  @Column()
  targetId: string;

  @Column({ type: 'json', nullable: true })
  beforeData: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  afterData: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
