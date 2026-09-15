const FULL_ACCESS = [
  'VIEW',
  'CREATE',
  'UPDATE',
  'DELETE',
  'EXPORT',
  'IMPORT',
  'APPROVE',
  'REJECT',
];

const VIEW_ONLY = ['VIEW'];

const VIEW_EXPORT = [
  'VIEW',
  'EXPORT',
];

export const defaultPermissions = [

  // ============================================================
  // SUPER ADMIN
  // EVERYTHING
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'HOME',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'CONTROL_TOWER',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'ITEM_TRACE',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'WAREHOUSE_NETWORK',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'INVENTORY',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'PROCESS_DETAILS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'SIMULATION',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'SCENARIOS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'ANALYTICS_REPORTS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'ALERTS_EXCEPTIONS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'MENU',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'SCREEN',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'ACTION',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'ROLE',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'ROLE_PERMISSION',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'USERS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'SETTINGS',
    actions: FULL_ACCESS,
  },


  // ============================================================
  // IT ADMIN
  // USER MANAGEMENT + SETTINGS
  // ============================================================

  {
    roleCode: 'IT_ADMIN',
    screenCode: 'ROLE',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'ROLE_PERMISSION',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'USERS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'SETTINGS',
    actions: FULL_ACCESS,
  },


  // ============================================================
  // EXECUTIVE
  // EVERYTHING EXCEPT MASTER + USER MANAGEMENT
  // ============================================================

  {
    roleCode: 'EXECUTIVE',
    screenCode: 'HOME',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'CONTROL_TOWER',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'ITEM_TRACE',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'WAREHOUSE_NETWORK',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'INVENTORY',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'PROCESS_DETAILS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'SIMULATION',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'SCENARIOS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'ANALYTICS_REPORTS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'ALERTS_EXCEPTIONS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'SETTINGS',
    actions: FULL_ACCESS,
  },


  // ============================================================
  // OPERATION MANAGER
  // ITEM TRACE + WAREHOUSE NETWORK + INVENTORY + OPERATIONS
  // ============================================================

  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'ITEM_TRACE',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'WAREHOUSE_NETWORK',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'INVENTORY',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'PROCESS_DETAILS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'SIMULATION',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'SCENARIOS',
    actions: FULL_ACCESS,
  },


  // ============================================================
  // WAREHOUSE MANAGER
  // ITEM TRACE + WAREHOUSE NETWORK + INVENTORY
  // ============================================================

  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'ITEM_TRACE',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'WAREHOUSE_NETWORK',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'INVENTORY',
    actions: FULL_ACCESS,
  },


  // ============================================================
  // OPERATOR
  // ITEM TRACE + ANALYTICS + ALERTS
  // ============================================================

  {
    roleCode: 'OPERATOR',
    screenCode: 'ITEM_TRACE',
    actions: VIEW_ONLY,
  },
  {
    roleCode: 'OPERATOR',
    screenCode: 'ANALYTICS_REPORTS',
    actions: VIEW_EXPORT,
  },
  {
    roleCode: 'OPERATOR',
    screenCode: 'ALERTS_EXCEPTIONS',
    actions: VIEW_ONLY,
  },
];
