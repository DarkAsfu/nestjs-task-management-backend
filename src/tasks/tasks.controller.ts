import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

type AuthUser = {
  id: string;
  email: string;
  role: string;
};

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: { user: AuthUser }) {
    return this.tasksService.createTask(createTaskDto, req.user);
  }

  @Get()
  findAll(@Req() req: { user: AuthUser }) {
    return this.tasksService.findAllTasks(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.tasksService.findTaskByIdForUser(id, req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: { user: AuthUser },
  ) {
    return this.tasksService.updateTask(id, updateTaskDto, req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @Req() req: { user: AuthUser },
  ) {
    return this.tasksService.updateTaskStatus(id, updateTaskStatusDto, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  delete(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.tasksService.deleteTask(id, req.user);
  }
}
