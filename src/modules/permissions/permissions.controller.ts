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
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto.js';

@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
  ) { }

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
  updateRolePermissions(
    @Param('roleId') roleId: string,
    @Body()
    dto: UpdateRolePermissionsDto,
  ) {
    return this.permissionsService.updateRolePermissions(
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