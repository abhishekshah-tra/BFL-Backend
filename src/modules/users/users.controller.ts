import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { UsersService } from './users.service.js';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // POST /users

  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(
      createUserDto,
    );
  }

  // GET /users

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // GET /users/active

  @Get('active')
  findActiveUsers() {
    return this.usersService.findActiveUsers();
  }

  // GET /users/inactive

  @Get('inactive')
  findInactiveUsers() {
    return this.usersService.findInactiveUsers();
  }

  // GET /users/:id

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.usersService.findOne(id);
  }

  // PATCH /users/:id

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
    );
  }

  // PATCH /users/:id/status

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body()
    updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(
      id,
      updateUserStatusDto,
    );
  }

  // PATCH /users/:id/activate

  @Patch(':id/activate')
  activate(
    @Param('id') id: string,
  ) {
    return this.usersService.activate(id);
  }

  // PATCH /users/:id/deactivate

  @Patch(':id/deactivate')
  deactivate(
    @Param('id') id: string,
  ) {
    return this.usersService.deactivate(id);
  }

  // DELETE /users/:id

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.usersService.remove(id);
  }
}