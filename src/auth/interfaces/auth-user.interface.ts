import { Types } from 'mongoose';

export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    code: string;
  };
  permissions: Array<{
    screenId: string;
    screenCode: string;
    screenName: string;
    actionId: string;
    actionCode: string;
    actionName: string;
  }>;
}