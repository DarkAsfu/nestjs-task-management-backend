import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { Role } from 'src/common/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

type AuthUser = {
  id: string;
  email: string;
  role: string;
};

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createTask(createTaskDto: CreateTaskDto, currentUser: AuthUser) {
    const assignedUser = await this.usersRepository.findOne({
      where: { id: createTaskDto.assignedUserId },
    });

    if (!assignedUser) {
      throw new BadRequestException('Assigned user not found');
    }

    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status,
      assignedUser,
    });

    const savedTask = await this.tasksRepository.save(task);
    const createdTask = await this.findTaskById(savedTask.id);
    const afterData = this.toResponse(createdTask);

    await this.auditLogsService.createLog({
      actorId: currentUser.id,
      actionType: 'TASK_CREATED',
      targetId: createdTask.id,
      beforeData: null,
      afterData,
    });

    return afterData;
  }

  async findAllTasks(currentUser: AuthUser) {
    if (currentUser.role === Role.ADMIN) {
      const tasks = await this.tasksRepository.find({
        relations: { assignedUser: true },
      });
      return tasks.map((task) => this.toResponse(task));
    }

    const tasks = await this.tasksRepository.find({
      where: { assignedUser: { id: currentUser.id } },
      relations: { assignedUser: true },
    });

    return tasks.map((task) => this.toResponse(task));
  }

  async findTaskByIdForUser(id: string, currentUser: AuthUser) {
    const task = await this.findTaskById(id);

    if (currentUser.role === Role.ADMIN) {
      return this.toResponse(task);
    }

    if (task.assignedUser.id !== currentUser.id) {
      throw new ForbiddenException('You can only view your own assigned task');
    }

    return this.toResponse(task);
  }

  async updateTask(id: string, updateTaskDto: UpdateTaskDto, currentUser: AuthUser) {
    const task = await this.findTaskById(id);
    const beforeData = this.toResponse(task);
    const previousAssignedUserId = task.assignedUser.id;
    const previousStatus = task.status;

    if (updateTaskDto.assignedUserId) {
      const assignedUser = await this.usersRepository.findOne({
        where: { id: updateTaskDto.assignedUserId },
      });

      if (!assignedUser) {
        throw new BadRequestException('Assigned user not found');
      }

      task.assignedUser = assignedUser;
    }

    if (updateTaskDto.title !== undefined) {
      task.title = updateTaskDto.title;
    }

    if (updateTaskDto.description !== undefined) {
      task.description = updateTaskDto.description;
    }

    if (updateTaskDto.status !== undefined) {
      task.status = updateTaskDto.status;
    }

    const updatedTask = await this.tasksRepository.save(task);
    const fullUpdatedTask = await this.findTaskById(updatedTask.id);
    const afterData = this.toResponse(fullUpdatedTask);

    await this.auditLogsService.createLog({
      actorId: currentUser.id,
      actionType: 'TASK_UPDATED',
      targetId: fullUpdatedTask.id,
      beforeData,
      afterData,
    });

    if (
      updateTaskDto.assignedUserId &&
      previousAssignedUserId !== fullUpdatedTask.assignedUser.id
    ) {
      await this.auditLogsService.createLog({
        actorId: currentUser.id,
        actionType: 'TASK_ASSIGNMENT_CHANGED',
        targetId: fullUpdatedTask.id,
        beforeData: { assignedUserId: previousAssignedUserId },
        afterData: { assignedUserId: fullUpdatedTask.assignedUser.id },
      });
    }

    if (updateTaskDto.status !== undefined && previousStatus !== fullUpdatedTask.status) {
      await this.auditLogsService.createLog({
        actorId: currentUser.id,
        actionType: 'TASK_STATUS_CHANGED',
        targetId: fullUpdatedTask.id,
        beforeData: { status: previousStatus },
        afterData: { status: fullUpdatedTask.status },
      });
    }

    return afterData;
  }

  async updateTaskStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    currentUser: AuthUser,
  ) {
    const task = await this.findTaskById(id);
    const beforeStatus = task.status;

    const isAdmin = currentUser.role === Role.ADMIN;
    const isOwnTask = task.assignedUser.id === currentUser.id;

    if (!isAdmin && !isOwnTask) {
      throw new ForbiddenException('You can only update your own assigned task');
    }

    task.status = updateTaskStatusDto.status;
    const updatedTask = await this.tasksRepository.save(task);
    const fullUpdatedTask = await this.findTaskById(updatedTask.id);
    const afterData = this.toResponse(fullUpdatedTask);

    await this.auditLogsService.createLog({
      actorId: currentUser.id,
      actionType: 'TASK_STATUS_CHANGED',
      targetId: fullUpdatedTask.id,
      beforeData: { status: beforeStatus },
      afterData: { status: fullUpdatedTask.status },
    });

    return afterData;
  }

  async deleteTask(id: string, currentUser: AuthUser) {
    const task = await this.findTaskById(id);
    const beforeData = this.toResponse(task);
    await this.tasksRepository.remove(task);

    await this.auditLogsService.createLog({
      actorId: currentUser.id,
      actionType: 'TASK_DELETED',
      targetId: id,
      beforeData,
      afterData: null,
    });

    return { message: 'Task deleted successfully' };
  }

  private async findTaskById(id: string) {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: { assignedUser: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private toResponse(task: Task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      assignedUser: {
        id: task.assignedUser.id,
        name: task.assignedUser.name,
        email: task.assignedUser.email,
        role: task.assignedUser.role,
      },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
