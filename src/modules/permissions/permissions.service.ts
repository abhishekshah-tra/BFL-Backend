import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Role,
  RoleDocument,
} from '../../schemas/role.schema.js';

import {
  Screen,
  ScreenDocument,
} from '../../schemas/screen.schema.js';

import {
  Action,
  ActionDocument,
} from '../../schemas/action.schema.js';

import {
  RolePermission,
  RolePermissionDocument,
} from '../../schemas/role-permission.schema.js';

import { AssignPermissionDto } from './dto/assign-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { log } from 'node:console';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermissionDocument>,

    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,

    @InjectModel(Screen.name)
    private readonly screenModel: Model<ScreenDocument>,

    @InjectModel(Action.name)
    private readonly actionModel: Model<ActionDocument>,
  ) {}

  async create(dto: AssignPermissionDto) {
    const [role, screen, action] = await Promise.all([
      this.roleModel.findById(dto.roleId),
      this.screenModel.findById(dto.screenId),
      this.actionModel.findById(dto.actionId),
    ]);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    const existing = await this.rolePermissionModel.findOne({
      roleId: dto.roleId,
      screenId: dto.screenId,
      actionId: dto.actionId,
    });

    if (existing) {
      throw new ConflictException(
        'Permission already assigned',
      );
    }

    return this.rolePermissionModel.create({
      roleId: new Types.ObjectId(dto.roleId),
      screenId: new Types.ObjectId(dto.screenId),
      actionId: new Types.ObjectId(dto.actionId),
      isActive: true,
    });
  }

  async findAll() {
    return this.rolePermissionModel
      .find({ isActive: true })
      .populate('roleId', 'name code')
      .populate('screenId', 'name code')
      .populate('actionId', 'name code')
      .lean();
  }

  async findByRole(roleId: string) {
    if (!Types.ObjectId.isValid(roleId)) {
      throw new BadRequestException('Invalid role ID');
    }

    const objectId = new Types.ObjectId(roleId);

    const role = await this.roleModel
      .findOne({
        _id: objectId,
        isActive: true,
      })
      .lean();

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.rolePermissionModel
      .find({
        roleId: objectId,
        isActive: true,
      })
      .populate({
        path: 'screenId',
        select: 'name code',
      })
      .populate({
        path: 'actionId',
        select: 'name code',
      })
      .lean();
  }

  async update(
    id: string,
    dto: AssignPermissionDto,
  ) {
    const permission =
      await this.rolePermissionModel.findById(id);

    if (!permission) {
      throw new NotFoundException(
        'Permission not found',
      );
    }

    const duplicate =
      await this.rolePermissionModel.findOne({
        roleId: dto.roleId,
        screenId: dto.screenId,
        actionId: dto.actionId,
        _id: { $ne: id },
      });

    if (duplicate) {
      throw new ConflictException(
        'Permission already exists',
      );
    }

    permission.roleId = new Types.ObjectId(dto.roleId);
    permission.screenId = new Types.ObjectId(dto.screenId);
    permission.actionId = new Types.ObjectId(dto.actionId);

    return permission.save();
  }

  async remove(id: string) {
    const permission =
      await this.rolePermissionModel.findById(id);

    if (!permission) {
      throw new NotFoundException(
        'Permission not found',
      );
    }

    permission.isActive = false;

    await permission.save();

    return {
      message: 'Permission removed successfully',
    };
  }

  /**
   * Replace all permissions for a role/screen.
   */
  async updateRoleScreenPermissions(
    roleId: string,
    dto: UpdatePermissionDto,
  ) {
    const role = await this.roleModel.findById(roleId);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const screen = await this.screenModel.findById(
      dto.screenId,
    );

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    const validActions =
      await this.actionModel.find({
        _id: { $in: dto.actionIds },
        isActive: true,
      });

    const validActionIds = validActions.map(
      action => action._id.toString(),
    );

    await this.rolePermissionModel.updateMany(
      {
        roleId,
        screenId: dto.screenId,
      },
      {
        $set: {
          isActive: false,
        },
      },
    );

    if (validActionIds.length > 0) {
      await this.rolePermissionModel.bulkWrite(
        validActionIds.map(actionId => ({
          updateOne: {
            filter: {
              roleId: new Types.ObjectId(roleId),
              screenId: new Types.ObjectId(dto.screenId),
              actionId: new Types.ObjectId(actionId),
            },
            update: {
              $set: {
                isActive: true,
              },
            },
            upsert: true,
          },
        })),
      );
    }

    return this.findByRole(roleId);
  }
}