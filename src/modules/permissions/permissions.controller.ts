import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';

import { PermissionsService } from './permissions.service.js';

import { AssignPermissionDto } from './dto/assign-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';

@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post()
  create(@Body() dto: AssignPermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('role/:roleId')
  findByRole(@Param('roleId') roleId: string) {
    return this.permissionsService.findByRole(roleId);
  }

  @Put('role/:roleId')
  updateRoleScreenPermissions(
    @Param('roleId') roleId: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionsService.updateRoleScreenPermissions(
      roleId,
      dto,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}