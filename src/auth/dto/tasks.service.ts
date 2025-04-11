import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private db: PrismaService) {}

  async createTask(dto: CreateTaskDto) {
    const { assigneeIds, title, description, status } = dto;

    const newTask = await this.db.task.create({
      data: {
        title,
        description: description ?? '', 
        status: status ?? 'TODO', 
        assignees: assigneeIds?.length
          ? {
              connect: assigneeIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: { assignees: true },
    });

    return {
      success: true,
      message: 'Task created successfully',
      data: newTask,
    };
  }

  async getAllTasks() {
    const tasks = await this.db.task.findMany({
      include: {
        assignees: true,
        comments: true,
      },
    });
    return {
      success: true,
      data: tasks,
    };
  }

  async updateTask(taskId: string, dto: UpdateTaskDto) {
    const existing = await this.db.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new NotFoundException('Task not found');

    const updated = await this.db.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description ?? '', 
        status: dto.status,
      },
    });

    return {
      success: true,
      message: 'Task updated successfully',
      data: updated,
    };
  }

  async deleteTask(taskId: string) {
    await this.db.task.delete({ where: { id: taskId } });

    return {
      success: true,
      message: 'Task deleted',
    };
  }
}
