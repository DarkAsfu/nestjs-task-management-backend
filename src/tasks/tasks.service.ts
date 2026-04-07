import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  ) {}

  async createTask(createTaskDto: CreateTaskDto) {
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
    return this.findTaskById(savedTask.id);
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

  async updateTask(id: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.findTaskById(id);

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
    return this.findTaskById(updatedTask.id).then((data) => this.toResponse(data));
  }

  async updateTaskStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    currentUser: AuthUser,
  ) {
    const task = await this.findTaskById(id);

    const isAdmin = currentUser.role === Role.ADMIN;
    const isOwnTask = task.assignedUser.id === currentUser.id;

    if (!isAdmin && !isOwnTask) {
      throw new ForbiddenException('You can only update your own assigned task');
    }

    task.status = updateTaskStatusDto.status;
    const updatedTask = await this.tasksRepository.save(task);
    return this.findTaskById(updatedTask.id).then((data) => this.toResponse(data));
  }

  async deleteTask(id: string) {
    const task = await this.findTaskById(id);
    await this.tasksRepository.remove(task);

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
