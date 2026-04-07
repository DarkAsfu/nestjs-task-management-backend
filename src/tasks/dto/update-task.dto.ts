import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { TaskStatus } from 'src/common/enums/task-status.enum';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
