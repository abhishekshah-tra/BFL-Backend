// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { defaultRoles } from './data/roles.seed.js';
// import { defaultActions } from './data/actions.seed.js';
// import { defaultMenus } from './data/menus.seed.js';
// import { defaultScreens } from './data/screens.seed.js';
// import { Role, RoleDocument } from '../role.schema.js';
// import { Action, ActionDocument } from '../action.schema.js';
// import { Menu, MenuDocument } from '../menu.schema.js';
// import { Screen, ScreenDocument } from '../screen.schema.js';
// import { RolePermission, RolePermissionDocument } from '../role-permission.schema.js';
// import { defaultPermissions } from './data/permissions.seed.js';

// @Injectable()
// export class SeedService {
//   private readonly logger = new Logger(SeedService.name);

//   constructor(
//     @InjectModel(Role.name)
//     private readonly roleModel: Model<RoleDocument>,

//     @InjectModel(Action.name)
//     private readonly actionModel: Model<ActionDocument>,

//     @InjectModel(Menu.name)
//     private readonly menuModel: Model<MenuDocument>,

//     @InjectModel(Screen.name)
//     private readonly screenModel: Model<ScreenDocument>,

//     @InjectModel(RolePermission.name)
//     private readonly rolePermissionModel: Model<RolePermissionDocument>,
//   ) {}

//   async run(): Promise<void> {
//     this.logger.log('🌱 Starting database seed...');

//     await this.seedRoles();
//     await this.seedActions();
//     await this.seedMenus();
//     await this.seedScreens();
//     await this.seedPermissions();

//     this.logger.log('🌱 Database seed completed successfully');
//   }

//   private async seedRoles(): Promise<void> {
//     for (const role of defaultRoles) {
//       await this.roleModel.updateOne(
//         {
//           code: role.code,
//         },
//         {
//           $set: {
//             name: role.name,
//             description: role.description,
//             isActive: role.isActive,
//             isSystemRole: role.isSystemRole,
//           },
//           $setOnInsert: {
//             code: role.code,
//           },
//         },
//         {
//           upsert: true,
//         },
//       );
//     }

//     this.logger.log('✅ Roles seeded');
//   }

//   private async seedActions(): Promise<void> {
//     for (const action of defaultActions) {
//       await this.actionModel.updateOne(
//         {
//           code: action.code,
//         },
//         {
//           $set: {
//             name: action.name,
//             description: action.description,
//             isActive: action.isActive,
//           },
//           $setOnInsert: {
//             code: action.code,
//           },
//         },
//         {
//           upsert: true,
//         },
//       );
//     }

//     this.logger.log('✅ Actions seeded');
//   }

//   private async seedMenus(): Promise<void> {
//     for (const menu of defaultMenus) {
//       await this.menuModel.updateOne(
//         {
//           code: menu.code,
//         },
//         {
//           $set: {
//             name: menu.name,
//             route: menu.route,
//             icon: menu.icon,
//             sortOrder: menu.sortOrder,
//             isActive: menu.isActive,
//           },
//           $setOnInsert: {
//             code: menu.code,
//             parentId: null,
//           },
//         },
//         {
//           upsert: true,
//         },
//       );
//     }

//     this.logger.log('✅ Menus seeded');
//   }

//   private async seedScreens(): Promise<void> {
//     const menus = await this.menuModel
//       .find({
//         code: {
//           $in: defaultScreens.map(
//             (screen) => screen.menuCode,
//           ),
//         },
//       })
//       .select('_id code')
//       .lean();

//     const menuMap = new Map(
//       menus.map((menu) => [
//         menu.code,
//         menu._id,
//       ]),
//     );

//     for (const screen of defaultScreens) {
//       const menuId = menuMap.get(screen.menuCode);

//       if (!menuId) {
//         throw new Error(
//           `Menu not found for screen: ${screen.code}`,
//         );
//       }

//       await this.screenModel.updateOne(
//         {
//           code: screen.code,
//         },
//         {
//           $set: {
//             name: screen.name,
//             menuId,
//             route: screen.route,
//             sortOrder: screen.sortOrder,
//             isActive: screen.isActive,
//           },
//           $setOnInsert: {
//             code: screen.code,
//           },
//         },
//         {
//           upsert: true,
//         },
//       );
//     }

//     this.logger.log('✅ Screens seeded');
//   }

//   private async seedPermissions(): Promise<void> {
//     const roleCodes = [
//       ...new Set(
//         defaultPermissions.map(
//           (permission) => permission.roleCode,
//         ),
//       ),
//     ];

//     const screenCodes = [
//       ...new Set(
//         defaultPermissions.map(
//           (permission) => permission.screenCode,
//         ),
//       ),
//     ];

//     const actionCodes = [
//       ...new Set(
//         defaultPermissions.flatMap(
//           (permission) => permission.actions,
//         ),
//       ),
//     ];

//     const [roles, screens, actions] = await Promise.all([
//       this.roleModel
//         .find({
//           code: { $in: roleCodes },
//         })
//         .select('_id code')
//         .lean(),

//       this.screenModel
//         .find({
//           code: { $in: screenCodes },
//         })
//         .select('_id code')
//         .lean(),

//       this.actionModel
//         .find({
//           code: { $in: actionCodes },
//         })
//         .select('_id code')
//         .lean(),
//     ]);

//     const roleMap = new Map(
//       roles.map((role) => [
//         role.code,
//         role._id,
//       ]),
//     );

//     const screenMap = new Map(
//       screens.map((screen) => [
//         screen.code,
//         screen._id,
//       ]),
//     );

//     const actionMap = new Map(
//       actions.map((action) => [
//         action.code,
//         action._id,
//       ]),
//     );

//     const operations = [];

//     for (const permission of defaultPermissions) {
//       const roleId = roleMap.get(
//         permission.roleCode,
//       );

//       const screenId = screenMap.get(
//         permission.screenCode,
//       );

//       if (!roleId) {
//         throw new Error(
//           `Role not found: ${permission.roleCode}`,
//         );
//       }

//       if (!screenId) {
//         throw new Error(
//           `Screen not found: ${permission.screenCode}`,
//         );
//       }

//       for (const actionCode of permission.actions) {
//         const actionId = actionMap.get(actionCode);

//         if (!actionId) {
//           throw new Error(
//             `Action not found: ${actionCode}`,
//           );
//         }

//         operations.push({
//           updateOne: {
//             filter: {
//               roleId,
//               screenId,
//               actionId,
//             },
//             update: {
//               $set: {
//                 isActive: true,
//               },
//             },
//             upsert: true,
//           },
//         });
//       }
//     }

//     if (operations.length > 0) {
//       await this.rolePermissionModel.bulkWrite(
//         operations,
//         {
//           ordered: false,
//         },
//       );
//     }

//     this.logger.log(
//       `✅ Permissions seeded: ${operations.length}`,
//     );
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { defaultRoles } from './data/roles.seed.js';
import { defaultActions } from './data/actions.seed.js';
import { defaultMenus } from './data/menus.seed.js';
import { defaultScreens } from './data/screens.seed.js';
import { defaultPermissions } from './data/permissions.seed.js';

import { Role, RoleDocument } from '../role.schema.js';
import { Action, ActionDocument } from '../action.schema.js';
import { Menu, MenuDocument } from '../menu.schema.js';
import { Screen, ScreenDocument } from '../screen.schema.js';
import {
  RolePermission,
  RolePermissionDocument,
} from '../role-permission.schema.js';

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

  // ============================================================
  // MAIN SEED
  // ============================================================

  async run(): Promise<void> {
    this.logger.log('🌱 Starting database seed...');

    await this.seedRoles();
    await this.seedActions();
    await this.seedMenus();
    await this.seedScreens();
    await this.seedPermissions();

    this.logger.log('🌱 Database seed completed successfully');
  }

  // ============================================================
  // ROLES
  // ============================================================

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

  // ============================================================
  // ACTIONS
  // ============================================================

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

  // ============================================================
  // MENUS
  // ============================================================

  private async seedMenus(): Promise<void> {
    this.logger.log('🌱 Seeding menus...');

    // ----------------------------------------------------------
    // PASS 1
    //
    // Create/update ALL menus first.
    // parentId is temporarily null.
    // ----------------------------------------------------------

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

            // Temporarily null.
            // It will be resolved in PASS 2.
            parentId: null,
          },

          $setOnInsert: {
            code: menu.code,
          },
        },
        {
          upsert: true,
        },
      );
    }

    // ----------------------------------------------------------
    // Get all menus from database
    // ----------------------------------------------------------

    const menus = await this.menuModel
      .find({
        code: {
          $in: defaultMenus.map(
            (menu) => menu.code,
          ),
        },
      })
      .select('_id code')
      .lean();

    // ----------------------------------------------------------
    // Create:
    //
    // MENU CODE → MONGO OBJECT ID
    //
    // Example:
    //
    // OPERATIONS → 67abc...
    // SIMULATION → 67def...
    // ----------------------------------------------------------

    const menuMap = new Map(
      menus.map((menu) => [
        menu.code,
        menu._id,
      ]),
    );

    // ----------------------------------------------------------
    // Validate all menus were created
    // ----------------------------------------------------------

    for (const menu of defaultMenus) {
      if (!menuMap.has(menu.code)) {
        throw new Error(
          `Menu not found after seeding: ${menu.code}`,
        );
      }
    }

    // ----------------------------------------------------------
    // PASS 2
    //
    // Resolve parentCode → parentId
    // ----------------------------------------------------------

    for (const menu of defaultMenus) {
      // Root menu
      if (!menu.parentCode) {
        await this.menuModel.updateOne(
          {
            code: menu.code,
          },
          {
            $set: {
              parentId: null,
            },
          },
        );

        continue;
      }

      // Find parent menu
      const parentId = menuMap.get(
        menu.parentCode,
      );

      if (!parentId) {
        throw new Error(
          `Parent menu not found for ${menu.code}: ${menu.parentCode}`,
        );
      }

      // Update parentId
      await this.menuModel.updateOne(
        {
          code: menu.code,
        },
        {
          $set: {
            parentId,
          },
        },
      );
    }

    this.logger.log('✅ Menus seeded');
  }

  // ============================================================
  // SCREENS
  // ============================================================

  private async seedScreens(): Promise<void> {
    this.logger.log('🌱 Seeding screens...');

    // ----------------------------------------------------------
    // Get required menu codes
    // ----------------------------------------------------------

    const menuCodes = [
      ...new Set(
        defaultScreens.map(
          (screen) => screen.menuCode,
        ),
      ),
    ];

    // ----------------------------------------------------------
    // Fetch menus
    // ----------------------------------------------------------

    const menus = await this.menuModel
      .find({
        code: {
          $in: menuCodes,
        },
      })
      .select('_id code')
      .lean();

    // ----------------------------------------------------------
    // MENU CODE → MENU ID
    // ----------------------------------------------------------

    const menuMap = new Map(
      menus.map((menu) => [
        menu.code,
        menu._id,
      ]),
    );

    // ----------------------------------------------------------
    // Validate menu references
    // ----------------------------------------------------------

    for (const screen of defaultScreens) {
      if (!menuMap.has(screen.menuCode)) {
        throw new Error(
          `Menu not found for screen ${screen.code}: ${screen.menuCode}`,
        );
      }
    }

    // ----------------------------------------------------------
    // Seed screens
    // ----------------------------------------------------------

    for (const screen of defaultScreens) {
      const menuId = menuMap.get(
        screen.menuCode,
      );

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

  // ============================================================
  // PERMISSIONS
  // ============================================================

  private async seedPermissions(): Promise<void> {
    this.logger.log('🌱 Seeding permissions...');

    // ----------------------------------------------------------
    // Get required role codes
    // ----------------------------------------------------------

    const roleCodes = [
      ...new Set(
        defaultPermissions.map(
          (permission) =>
            permission.roleCode,
        ),
      ),
    ];

    // ----------------------------------------------------------
    // Get required screen codes
    // ----------------------------------------------------------

    const screenCodes = [
      ...new Set(
        defaultPermissions.map(
          (permission) =>
            permission.screenCode,
        ),
      ),
    ];

    // ----------------------------------------------------------
    // Get required action codes
    // ----------------------------------------------------------

    const actionCodes = [
      ...new Set(
        defaultPermissions.flatMap(
          (permission) =>
            permission.actions,
        ),
      ),
    ];

    // ----------------------------------------------------------
    // Fetch everything in parallel
    // ----------------------------------------------------------

    const [
      roles,
      screens,
      actions,
    ] = await Promise.all([
      this.roleModel
        .find({
          code: {
            $in: roleCodes,
          },
        })
        .select('_id code')
        .lean(),

      this.screenModel
        .find({
          code: {
            $in: screenCodes,
          },
        })
        .select('_id code')
        .lean(),

      this.actionModel
        .find({
          code: {
            $in: actionCodes,
          },
        })
        .select('_id code')
        .lean(),
    ]);

    // ----------------------------------------------------------
    // Create maps
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // Validate references
    // ----------------------------------------------------------

    for (const permission of defaultPermissions) {
      if (!roleMap.has(permission.roleCode)) {
        throw new Error(
          `Role not found: ${permission.roleCode}`,
        );
      }

      if (
        !screenMap.has(
          permission.screenCode,
        )
      ) {
        throw new Error(
          `Screen not found: ${permission.screenCode}`,
        );
      }

      for (const actionCode of permission.actions) {
        if (!actionMap.has(actionCode)) {
          throw new Error(
            `Action not found: ${actionCode}`,
          );
        }
      }
    }

    // ----------------------------------------------------------
    // Build bulk operations
    // ----------------------------------------------------------

    const operations = [];

    for (const permission of defaultPermissions) {
      const roleId = roleMap.get(
        permission.roleCode,
      );

      const screenId = screenMap.get(
        permission.screenCode,
      );

      for (const actionCode of permission.actions) {
        const actionId = actionMap.get(
          actionCode,
        );

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

    // ----------------------------------------------------------
    // Execute bulk write
    // ----------------------------------------------------------

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