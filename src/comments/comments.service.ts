import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
    constructor(private prisma: PrismaService) { }

    async create(createCommentDto: CreateCommentDto, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: createCommentDto.taskId },
            include: { assignees: true },
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const isAssignee = task.assignees.some((assignee) => assignee.userId === userId);
        if (!isAssignee) {
            throw new ForbiddenException('You are not assigned to this task');
        }

        return this.prisma.comment.create({
            data: {
                content: createCommentDto.content,
                task: { connect: { id: createCommentDto.taskId } },
                user: { connect: { id: userId } },
            },
            include: {
                user: true,
            },
        });
    }

    async findAll(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { assignees: true },
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const isAssignee = task.assignees.some((assignee) => assignee.userId === userId);
        if (!isAssignee) {
            throw new ForbiddenException('You are not assigned to this task');
        }

        return this.prisma.comment.findMany({
            where: { taskId },
            include: {
                user: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async remove(id: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id },
            include: {
                task: {
                    include: {
                        assignees: true,
                    },
                },
            },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        const isAssignee = comment.task.assignees.some((assignee) => assignee.userId === userId);
        if (!isAssignee) {
            throw new ForbiddenException('You are not assigned to this task');
        }

        if (comment.userId !== userId) {
            throw new ForbiddenException('You can only delete your own comments');
        }

        return this.prisma.comment.delete({
            where: { id },
        });
    }
}
