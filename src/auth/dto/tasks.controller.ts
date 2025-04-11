import { Controller, Post, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private taskService: TasksService) {}

  @Post()
  create(@Body() body: CreateTaskDto) {
    return this.taskService.createTask(body);
  }

  @Get()
  getAll() {
    return this.taskService.getAllTasks();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateTaskDto) {
    return this.taskService.updateTask(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.taskService.deleteTask(id);
  }
}
