export const defaultMenus = [
  // ============================================================
  // ROOT MENUS
  // ============================================================

  {
    name: 'Home',
    code: 'HOME',
    parentCode: null,
    route: '/home',
    icon: 'home',
    sortOrder: 1,
    isActive: true,
  },

  {
    name: 'Control Tower',
    code: 'CONTROL_TOWER',
    parentCode: null,
    route: '/control-tower',
    icon: 'control-tower',
    sortOrder: 2,
    isActive: true,
  },

  {
    name: 'End to End Item Trace',
    code: 'ITEM_TRACE',
    parentCode: null,
    route: '/item-trace',
    icon: 'route',
    sortOrder: 3,
    isActive: true,
  },

  {
    name: 'Warehouse Network',
    code: 'WAREHOUSE_NETWORK',
    parentCode: null,
    route: '/warehouse-network',
    icon: 'network',
    sortOrder: 4,
    isActive: true,
  },

  {
    name: 'Inventory',
    code: 'INVENTORY',
    parentCode: null,
    route: '/inventory',
    icon: 'boxes',
    sortOrder: 5,
    isActive: true,
  },

  // ============================================================
  // OPERATIONS
  // ============================================================

  {
    name: 'Operations',
    code: 'OPERATIONS',
    parentCode: null,
    route: '/operations',
    icon: 'settings',
    sortOrder: 6,
    isActive: true,
  },

  {
    name: 'Process Details',
    code: 'PROCESS_DETAILS',
    parentCode: 'OPERATIONS',
    route: '/operations/process',
    icon: 'workflow',
    sortOrder: 1,
    isActive: true,
  },

  {
    name: 'Simulation',
    code: 'SIMULATION',
    parentCode: 'OPERATIONS',
    route: '/operations/simulation',
    icon: 'simulation',
    sortOrder: 2,
    isActive: true,
  },

  {
    name: 'Scenarios',
    code: 'SCENARIOS',
    parentCode: 'SIMULATION',
    route: '/operations/simulation/scenarios',
    icon: 'scenario',
    sortOrder: 1,
    isActive: true,
  },

  // ============================================================
  // ANALYTICS
  // ============================================================

  {
    name: 'Analytics & Reports',
    code: 'ANALYTICS_REPORTS',
    parentCode: null,
    route: '/analytics',
    icon: 'bar-chart',
    sortOrder: 7,
    isActive: true,
  },

  // ============================================================
  // ALERTS
  // ============================================================

  {
    name: 'Alerts & Exceptions',
    code: 'ALERTS_EXCEPTIONS',
    parentCode: null,
    route: '/alerts',
    icon: 'alert-triangle',
    sortOrder: 8,
    isActive: true,
  },

  // ============================================================
  // MASTER
  // ============================================================

  {
    name: 'Master',
    code: 'MASTER',
    parentCode: null,
    route: '/master',
    icon: 'database',
    sortOrder: 9,
    isActive: true,
  },

  {
    name: 'Menu',
    code: 'MENU',
    parentCode: 'MASTER',
    route: '/master/menu',
    icon: 'menu',
    sortOrder: 1,
    isActive: true,
  },

  {
    name: 'Screen',
    code: 'SCREEN',
    parentCode: 'MASTER',
    route: '/master/screen',
    icon: 'screen',
    sortOrder: 2,
    isActive: true,
  },

  {
    name: 'Action',
    code: 'ACTION',
    parentCode: 'MASTER',
    route: '/master/action',
    icon: 'action',
    sortOrder: 3,
    isActive: true,
  },

  // ============================================================
  // USER MANAGEMENT
  // ============================================================

  {
    name: 'User Management',
    code: 'USER_MANAGEMENT',
    parentCode: null,
    route: '/user-management',
    icon: 'users',
    sortOrder: 10,
    isActive: true,
  },

  {
    name: 'Role',
    code: 'ROLE',
    parentCode: 'USER_MANAGEMENT',
    route: '/user-management/role',
    icon: 'role',
    sortOrder: 1,
    isActive: true,
  },

  {
    name: 'Role Permission',
    code: 'ROLE_PERMISSION',
    parentCode: 'USER_MANAGEMENT',
    route: '/user-management/role-permission',
    icon: 'permission',
    sortOrder: 2,
    isActive: true,
  },

  {
    name: 'Users',
    code: 'USERS',
    parentCode: 'USER_MANAGEMENT',
    route: '/user-management/users',
    icon: 'users',
    sortOrder: 3,
    isActive: true,
  },

  // ============================================================
  // SETTINGS
  // ============================================================

  {
    name: 'Settings',
    code: 'SETTINGS',
    parentCode: null,
    route: '/settings',
    icon: 'settings',
    sortOrder: 11,
    isActive: true,
  },
];