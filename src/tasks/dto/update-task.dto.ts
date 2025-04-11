import { IsString, IsOptional, IsArray, IsUUID, IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    assigneeIds?: string[];
} 