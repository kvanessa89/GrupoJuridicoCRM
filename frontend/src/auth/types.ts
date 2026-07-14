import type { Role } from './roles';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  color: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  color: string;
}
