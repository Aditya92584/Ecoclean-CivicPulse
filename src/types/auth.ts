export type UserRole = 'citizen' | 'staff' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export const DEMO_USERS: Record<UserRole, AuthUser> = {
  citizen: {
    id: 'usr-citizen-01',
    name: 'Elena Rostova',
    email: 'elena.citizen@civicpulse.org',
    role: 'citizen',
    department: 'District 4 Resident',
  },
  staff: {
    id: 'usr-staff-02',
    name: 'Officer Dave Miller',
    email: 'dave.miller@sanitation.gov',
    role: 'staff',
    department: 'Zone 2 Rapid Clean Unit',
  },
  admin: {
    id: 'usr-admin-03',
    name: 'Director Marcus Vance',
    email: 'director.vance@cityops.gov',
    role: 'admin',
    department: 'Municipal Operations Command',
  },
};
