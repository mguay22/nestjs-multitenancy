import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as schema from './schema';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(user: typeof schema.users.$inferInsert) {
    await this.databaseService.getDatabase().insert(schema.users).values(user);
  }

  async getUsers() {
    return this.databaseService.getDatabase().query.users.findMany();
  }
}
