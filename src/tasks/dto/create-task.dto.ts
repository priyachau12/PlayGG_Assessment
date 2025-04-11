import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    status?: TaskStatus;

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    assigneeIds?: string[];
} 