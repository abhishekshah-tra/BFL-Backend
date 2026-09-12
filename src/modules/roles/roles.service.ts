import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Role,
  RoleDocument,
} from '../../schemas/role.schema.js';

import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
  ) {}

  async create(dto: CreateRoleDto) {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.roleModel.findOne({ code });

    if (existing) {
      throw new ConflictException(
        `Role with code ${code} already exists`,
      );
    }

    return this.roleModel.create({
      ...dto,
      code,
    });
  }

  async findAll() {
    return this.roleModel
      .find()
      .sort({ name: 1 })
      .lean();
  }

  async findOne(id: string) {
    const role = await this.roleModel.findById(id).lean();

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.roleModel.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();

      const existing = await this.roleModel.findOne({
        code,
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException(
          `Role with code ${code} already exists`,
        );
      }

      dto.code = code;
    }

    Object.assign(role, dto);

    return role.save();
  }

  async remove(id: string) {
    const role = await this.roleModel.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystemRole) {
      throw new ConflictException(
        'System role cannot be deleted',
      );
    }

    role.isActive = false;

    await role.save();

    return {
      message: 'Role deactivated successfully',
    };
  }
}