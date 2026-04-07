import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { TaskStatus } from 'src/common/enums/task-status.enum';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsUUID()
  assignedUserId: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
