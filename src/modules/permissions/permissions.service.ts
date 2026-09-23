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
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto.js';

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
  ) { }

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


  async updateRolePermissions(
    roleId: string,
    dto: UpdateRolePermissionsDto,
  ) {

    if (!Types.ObjectId.isValid(roleId)) {
      throw new BadRequestException(
        'Invalid role ID',
      );
    }

    const roleObjectId =
      new Types.ObjectId(roleId);

    const role = await this.roleModel
      .findOne({
        _id: roleObjectId,
        isActive: true,
      })
      .lean();

    if (!role) {
      throw new NotFoundException(
        'Role not found',
      );
    }

    if (
      !dto.permissions ||
      dto.permissions.length === 0
    ) {
      await this.rolePermissionModel.updateMany(
        {
          roleId: roleObjectId,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
          },
        },
      );

      return {
        message:
          'All permissions removed successfully',
        roleId,
        permissions: [],
      };
    }

    const uniquePermissions = Array.from(
      new Map(
        dto.permissions.map((permission) => [
          `${permission.screenId}_${permission.actionId}`,
          permission,
        ]),
      ).values(),
    );

    const screenIds = [
      ...new Set(
        uniquePermissions.map(
          (permission) =>
            permission.screenId,
        ),
      ),
    ];

    const actionIds = [
      ...new Set(
        uniquePermissions.map(
          (permission) =>
            permission.actionId,
        ),
      ),
    ];

    const screens =
      await this.screenModel.find({
        _id: {
          $in: screenIds.map(
            (id) => new Types.ObjectId(id),
          ),
        },
        isActive: true,
      });

    const validScreenIds = new Set(
      screens.map((screen) =>
        screen._id.toString(),
      ),
    );

    const invalidScreenIds =
      screenIds.filter(
        (id) => !validScreenIds.has(id),
      );

    if (invalidScreenIds.length > 0) {
      throw new BadRequestException(
        `Invalid or inactive screen IDs: ${invalidScreenIds.join(', ')}`,
      );
    }


    const actions =
      await this.actionModel.find({
        _id: {
          $in: actionIds.map(
            (id) => new Types.ObjectId(id),
          ),
        },
        isActive: true,
      });

    const validActionIds = new Set(
      actions.map((action) =>
        action._id.toString(),
      ),
    );

    const invalidActionIds =
      actionIds.filter(
        (id) => !validActionIds.has(id),
      );

    if (invalidActionIds.length > 0) {
      throw new BadRequestException(
        `Invalid or inactive action IDs: ${invalidActionIds.join(', ')}`,
      );
    }

    const requestedPermissionKeys =
      new Set(
        uniquePermissions.map(
          (permission) =>
            `${permission.screenId}_${permission.actionId}`,
        ),
      );

    const existingPermissions =
      await this.rolePermissionModel.find({
        roleId: roleObjectId,
      });

    const permissionsToDeactivate =
      existingPermissions.filter(
        (permission) =>
          !requestedPermissionKeys.has(
            `${permission.screenId.toString()}_${permission.actionId.toString()}`,
          ),
      );

    if (
      permissionsToDeactivate.length > 0
    ) {
      await this.rolePermissionModel.updateMany(
        {
          _id: {
            $in: permissionsToDeactivate.map(
              (permission) =>
                permission._id,
            ),
          },
        },
        {
          $set: {
            isActive: false,
          },
        },
      );
    }


    const bulkOperations =
      uniquePermissions.map(
        (permission) => ({
          updateOne: {
            filter: {
              roleId: roleObjectId,
              screenId:
                new Types.ObjectId(
                  permission.screenId,
                ),
              actionId:
                new Types.ObjectId(
                  permission.actionId,
                ),
            },

            update: {
              $set: {
                isActive: true,
              },

              $setOnInsert: {
                roleId: roleObjectId,
                screenId:
                  new Types.ObjectId(
                    permission.screenId,
                  ),
                actionId:
                  new Types.ObjectId(
                    permission.actionId,
                  ),
              },
            },

            upsert: true,
          },
        }),
      );

    if (bulkOperations.length > 0) {
      await this.rolePermissionModel.bulkWrite(
        bulkOperations,
      );
    }
    const updatedPermissions =
      await this.rolePermissionModel
        .find({
          roleId: roleObjectId,
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

    return {
      message:
        'Role permissions updated successfully',
      roleId,
      permissions: updatedPermissions,
    };
  }
}