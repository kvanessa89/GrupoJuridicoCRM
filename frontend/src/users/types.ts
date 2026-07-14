import type { Role } from '../auth/roles';

export interface User {
  id: string;
  name: string;
  title: string | null;
  email: string;
  role: Role;
  color: string;
  supervisorId: string | null;
}

export interface UserFormValues {
  name: string;
  title: string;
  email: string;
  password: string;
  role: Role;
  color: string;
  supervisorId: string | null;
}
