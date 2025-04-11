import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignUsersDto } from '../auth/dto/assign-users.dto';
import { UpdateTaskStatusDto } from '../auth/dto/update-task-status.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) { }

  async create(createTaskDto: CreateTaskDto, userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const { assigneeIds = [], ...taskData } = createTaskDto;

      // Ensure the creator is included in assignees
      const finalAssigneeIds = [userId, ...(assigneeIds || [])].filter(Boolean);

      if (finalAssigneeIds.length === 0) {
        throw new BadRequestException('At least one assignee is required');
      }

      // Verify all assignees exist
      const users = await this.prisma.user.findMany({
        where: {
          id: {
            in: finalAssigneeIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (users.length !== finalAssigneeIds.length) {
        throw new BadRequestException('One or more assignees do not exist');
      }

      const task = await this.prisma.task.create({
        data: {
          ...taskData,
          description: taskData.description || '',
          status: taskData.status || TaskStatus.TODO,
          assignees: {
            create: finalAssigneeIds.map((assigneeId) => ({
              user: { connect: { id: assigneeId } },
            })),
          },
        },
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
          comments: true,
        },
      });

      return task;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create task: ' + error.message);
    }
  }

  async findAll(userId: string, status?: TaskStatus, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          assignees: {
            some: {
              userId,
            },
          },
          ...(status && { status }),
        },
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
          comments: true,
        },
        skip,
        take: limit,
        orderBy: {
          id: 'desc',
        },
      }),
      this.prisma.task.count({
        where: {
          assignees: {
            some: {
              userId,
            },
          },
          ...(status && { status }),
        },
      }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAssignee = task.assignees.some((assignee) => assignee.userId === userId);
    if (!isAssignee) {
      throw new ForbiddenException('You are not assigned to this task');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAssignee = task.assignees.some((assignee) => assignee.userId === userId);
    if (!isAssignee) {
      throw new ForbiddenException('You are not assigned to this task');
    }

    const { assigneeIds, ...taskData } = updateTaskDto;

    return this.prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        assignees: assigneeIds
          ? {
            deleteMany: {},
            create: assigneeIds.map((assigneeId) => ({
              user: { connect: { id: assigneeId } },
            })),
          }
          : undefined,
      },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
        comments: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAssignee = task.assignees.some((assignee) => assignee.userId === userId);
    if (!isAssignee) {
      throw new ForbiddenException('You are not assigned to this task');
    }

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async assignUsersToTask(id: string, dto: AssignUsersDto, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAssignee = task.assignees.some((assignee) => assignee.userId === userId);
    if (!isAssignee) {
      throw new ForbiddenException('You are not assigned to this task');
    }

    // Verify all new assignees exist
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: dto.userIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (users.length !== dto.userIds.length) {
      throw new BadRequestException('One or more users do not exist');
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        assignees: {
          create: dto.userIds.map((userId) => ({
            user: { connect: { id: userId } },
          })),
        },
      },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async updateTaskStatus(id: string, dto: UpdateTaskStatusDto, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAssignee = task.assignees.some((assignee) => assignee.userId === userId);
    if (!isAssignee) {
      throw new ForbiddenException('You are not assigned to this task');
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        status: dto.status as TaskStatus,
      },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}
