import { UserRole } from './auth';

export interface LoginLogEntry {
  id?: string;
  _id?: string;
  email: string;
  role: UserRole;
  name?: string;
  action?: 'login' | 'role_switch' | 'register';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}
