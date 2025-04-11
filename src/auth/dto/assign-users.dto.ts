import { IsArray, IsUUID } from 'class-validator';

export class AssignUsersDto {
  @IsArray()
  @IsUUID('all', { each: true }) 
  userIds: string[];
}
