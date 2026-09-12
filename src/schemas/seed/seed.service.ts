import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { defaultRoles } from './data/roles.seed.js';
import { defaultActions } from './data/actions.seed.js';
import { defaultMenus } from './data/menus.seed.js';
import { defaultScreens } from './data/screens.seed.js';
import { Role, RoleDocument } from '../role.schema.js';
import { Action, ActionDocument } from '../action.schema.js';
import { Menu, MenuDocument } from '../menu.schema.js';
import { Screen, ScreenDocument } from '../screen.schema.js';
import { RolePermission, RolePermissionDocument } from '../role-permission.schema.js';
import { defaultPermissions } from './data/permissions.seed.js';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,

    @InjectModel(Action.name)
    private readonly actionModel: Model<ActionDocument>,

    @InjectModel(Menu.name)
    private readonly menuModel: Model<MenuDocument>,

    @InjectModel(Screen.name)
    private readonly screenModel: Model<ScreenDocument>,

    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Starting database seed...');

    await this.seedRoles();
    await this.seedActions();
    await this.seedMenus();
    await this.seedScreens();
    await this.seedPermissions();

    this.logger.log('🌱 Database seed completed successfully');
  }

  private async seedRoles(): Promise<void> {
    for (const role of defaultRoles) {
      await this.roleModel.updateOne(
        {
          code: role.code,
        },
        {
          $set: {
            name: role.name,
            description: role.description,
            isActive: role.isActive,
            isSystemRole: role.isSystemRole,
          },
          $setOnInsert: {
            code: role.code,
          },
        },
        {
          upsert: true,
        },
      );
    }

    this.logger.log('✅ Roles seeded');
  }

  private async seedActions(): Promise<void> {
    for (const action of defaultActions) {
      await this.actionModel.updateOne(
        {
          code: action.code,
        },
        {
          $set: {
            name: action.name,
            description: action.description,
            isActive: action.isActive,
          },
          $setOnInsert: {
            code: action.code,
          },
        },
        {
          upsert: true,
        },
      );
    }

    this.logger.log('✅ Actions seeded');
  }

  private async seedMenus(): Promise<void> {
    for (const menu of defaultMenus) {
      await this.menuModel.updateOne(
        {
          code: menu.code,
        },
        {
          $set: {
            name: menu.name,
            route: menu.route,
            icon: menu.icon,
            sortOrder: menu.sortOrder,
            isActive: menu.isActive,
          },
          $setOnInsert: {
            code: menu.code,
            parentId: null,
          },
        },
        {
          upsert: true,
        },
      );
    }

    this.logger.log('✅ Menus seeded');
  }

  private async seedScreens(): Promise<void> {
    const menus = await this.menuModel
      .find({
        code: {
          $in: defaultScreens.map(
            (screen) => screen.menuCode,
          ),
        },
      })
      .select('_id code')
      .lean();

    const menuMap = new Map(
      menus.map((menu) => [
        menu.code,
        menu._id,
      ]),
    );

    for (const screen of defaultScreens) {
      const menuId = menuMap.get(screen.menuCode);

      if (!menuId) {
        throw new Error(
          `Menu not found for screen: ${screen.code}`,
        );
      }

      await this.screenModel.updateOne(
        {
          code: screen.code,
        },
        {
          $set: {
            name: screen.name,
            menuId,
            route: screen.route,
            sortOrder: screen.sortOrder,
            isActive: screen.isActive,
          },
          $setOnInsert: {
            code: screen.code,
          },
        },
        {
          upsert: true,
        },
      );
    }

    this.logger.log('✅ Screens seeded');
  }

  private async seedPermissions(): Promise<void> {
    const roleCodes = [
      ...new Set(
        defaultPermissions.map(
          (permission) => permission.roleCode,
        ),
      ),
    ];

    const screenCodes = [
      ...new Set(
        defaultPermissions.map(
          (permission) => permission.screenCode,
        ),
      ),
    ];

    const actionCodes = [
      ...new Set(
        defaultPermissions.flatMap(
          (permission) => permission.actions,
        ),
      ),
    ];

    const [roles, screens, actions] = await Promise.all([
      this.roleModel
        .find({
          code: { $in: roleCodes },
        })
        .select('_id code')
        .lean(),

      this.screenModel
        .find({
          code: { $in: screenCodes },
        })
        .select('_id code')
        .lean(),

      this.actionModel
        .find({
          code: { $in: actionCodes },
        })
        .select('_id code')
        .lean(),
    ]);

    const roleMap = new Map(
      roles.map((role) => [
        role.code,
        role._id,
      ]),
    );

    const screenMap = new Map(
      screens.map((screen) => [
        screen.code,
        screen._id,
      ]),
    );

    const actionMap = new Map(
      actions.map((action) => [
        action.code,
        action._id,
      ]),
    );

    const operations = [];

    for (const permission of defaultPermissions) {
      const roleId = roleMap.get(
        permission.roleCode,
      );

      const screenId = screenMap.get(
        permission.screenCode,
      );

      if (!roleId) {
        throw new Error(
          `Role not found: ${permission.roleCode}`,
        );
      }

      if (!screenId) {
        throw new Error(
          `Screen not found: ${permission.screenCode}`,
        );
      }

      for (const actionCode of permission.actions) {
        const actionId = actionMap.get(actionCode);

        if (!actionId) {
          throw new Error(
            `Action not found: ${actionCode}`,
          );
        }

        operations.push({
          updateOne: {
            filter: {
              roleId,
              screenId,
              actionId,
            },
            update: {
              $set: {
                isActive: true,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (operations.length > 0) {
      await this.rolePermissionModel.bulkWrite(
        operations,
        {
          ordered: false,
        },
      );
    }

    this.logger.log(
      `✅ Permissions seeded: ${operations.length}`,
    );
  }
}