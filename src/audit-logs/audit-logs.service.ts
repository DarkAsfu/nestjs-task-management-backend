import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

type LogInput = {
  actorId: string;
  actionType: string;
  targetId: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
};

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createLog(input: LogInput) {
    const actor = await this.usersRepository.findOne({
      where: { id: input.actorId },
    });

    if (!actor) {
      return null;
    }

    const log = this.auditLogsRepository.create({
      actor,
      actionType: input.actionType,
      targetId: input.targetId,
      beforeData: input.beforeData ?? null,
      afterData: input.afterData ?? null,
    });

    return this.auditLogsRepository.save(log);
  }

  async findAll() {
    const logs = await this.auditLogsRepository.find({
      relations: { actor: true },
      order: { createdAt: 'DESC' },
    });

    return logs.map((log) => this.toResponse(log));
  }

  async findByTaskId(taskId: string) {
    const logs = await this.auditLogsRepository.find({
      where: { targetId: taskId },
      relations: { actor: true },
      order: { createdAt: 'DESC' },
    });

    return logs.map((log) => this.toResponse(log));
  }

  private toResponse(log: AuditLog) {
    return {
      id: log.id,
      actor: {
        id: log.actor.id,
        name: log.actor.name,
        email: log.actor.email,
        role: log.actor.role,
      },
      actionType: log.actionType,
      targetId: log.targetId,
      beforeData: log.beforeData,
      afterData: log.afterData,
      createdAt: log.createdAt,
    };
  }
}
