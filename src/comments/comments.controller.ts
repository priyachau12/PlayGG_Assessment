import {
    Controller,
    Get,
    Post,
    Body,
    Delete,
    Param,
    UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new comment' })
    @ApiResponse({ status: 201, description: 'Comment created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    create(@Body() createCommentDto: CreateCommentDto, @GetUser('id') userId: string) {
        return this.commentsService.create(createCommentDto, userId);
    }

    @Get('task/:taskId')
    @ApiOperation({ summary: 'Get all comments for a task' })
    @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    findAll(@Param('taskId') taskId: string, @GetUser('id') userId: string) {
        return this.commentsService.findAll(taskId, userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a comment' })
    @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    remove(@Param('id') id: string, @GetUser('id') userId: string) {
        return this.commentsService.remove(id, userId);
    }
}
