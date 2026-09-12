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

export const defaultPermissions = [
  // ============================================================
  // DASHBOARD
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'DASHBOARD',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'DASHBOARD',
    actions: ['VIEW'],
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'DASHBOARD',
    actions: ['VIEW'],
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'DASHBOARD',
    actions: ['VIEW'],
  },
  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'DASHBOARD',
    actions: ['VIEW'],
  },
  {
    roleCode: 'OPERATOR',
    screenCode: 'DASHBOARD',
    actions: ['VIEW'],
  },

  // ============================================================
  // USERS
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'USERS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'USERS',
    actions: FULL_ACCESS,
  },

  // ============================================================
  // ROLES
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'ROLES',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'ROLES',
    actions: FULL_ACCESS,
  },

  // ============================================================
  // PERMISSIONS
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'PERMISSIONS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'PERMISSIONS',
    actions: FULL_ACCESS,
  },

  // ============================================================
  // OPERATIONS
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'OPERATIONS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'OPERATIONS',
    actions: ['VIEW'],
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'OPERATIONS',
    actions: ['VIEW'],
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'OPERATIONS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'OPERATIONS',
    actions: ['VIEW'],
  },
  {
    roleCode: 'OPERATOR',
    screenCode: 'OPERATIONS',
    actions: ['VIEW'],
  },

  // ============================================================
  // ORDERS
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'ORDERS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'ORDERS',
    actions: ['VIEW'],
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'ORDERS',
    actions: ['VIEW'],
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'ORDERS',
    actions: [
      'CREATE',
      'UPDATE',
      'APPROVE',
    ],
  },
  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'ORDERS',
    actions: ['VIEW'],
  },
  {
    roleCode: 'OPERATOR',
    screenCode: 'ORDERS',
    actions: [
      'CREATE',
      'UPDATE',
    ],
  },

  // ============================================================
  // WAREHOUSE
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'WAREHOUSE',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'WAREHOUSE',
    actions: ['VIEW'],
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'WAREHOUSE',
    actions: ['VIEW'],
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'WAREHOUSE',
    actions: ['VIEW'],
  },
  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'WAREHOUSE',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'OPERATOR',
    screenCode: 'WAREHOUSE',
    actions: ['VIEW'],
  },

  // ============================================================
  // INVENTORY
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'INVENTORY',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'INVENTORY',
    actions: ['VIEW'],
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'INVENTORY',
    actions: ['VIEW'],
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'INVENTORY',
    actions: ['VIEW'],
  },
  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'INVENTORY',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'OPERATOR',
    screenCode: 'INVENTORY',
    actions: [
      'CREATE',
      'UPDATE',
    ],
  },

  // ============================================================
  // REPORTS
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'REPORTS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'REPORTS',
    actions: [
      'VIEW',
      'EXPORT',
    ],
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'REPORTS',
    actions: [
      'VIEW',
      'EXPORT',
    ],
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'REPORTS',
    actions: [
      'VIEW',
      'EXPORT',
    ],
  },
  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'REPORTS',
    actions: [
      'VIEW',
      'EXPORT',
    ],
  },
  {
    roleCode: 'OPERATOR',
    screenCode: 'REPORTS',
    actions: ['VIEW'],
  },

  // ============================================================
  // AUDIT LOGS
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'AUDIT_LOGS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'AUDIT_LOGS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'AUDIT_LOGS',
    actions: ['VIEW'],
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'AUDIT_LOGS',
    actions: ['VIEW'],
  },
  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'AUDIT_LOGS',
    actions: ['VIEW'],
  },

  // ============================================================
  // SETTINGS
  // ============================================================

  {
    roleCode: 'SUPER_ADMIN',
    screenCode: 'SETTINGS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'IT_ADMIN',
    screenCode: 'SETTINGS',
    actions: FULL_ACCESS,
  },
  {
    roleCode: 'EXECUTIVE',
    screenCode: 'SETTINGS',
    actions: ['VIEW'],
  },
  {
    roleCode: 'OPERATION_MANAGER',
    screenCode: 'SETTINGS',
    actions: ['VIEW'],
  },
  {
    roleCode: 'WAREHOUSE_MANAGER',
    screenCode: 'SETTINGS',
    actions: ['VIEW'],
  },
];