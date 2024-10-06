import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() request: { email: string; password: string }) {
    return this.usersService.createUser(request);
  }

  @Get()
  async getUsers() {
    return this.usersService.getUsers();
  }
}
