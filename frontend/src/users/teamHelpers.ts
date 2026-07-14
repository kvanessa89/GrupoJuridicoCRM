import type { AuthUser } from '../auth/types';
import { Roles, isAdmin, isSupervisor, isAsesor } from '../auth/roles';
import type { User } from './types';

// Asesores visibles/gestionables por el usuario actual — misma regla que
// managedIds() en el diseño original y que el scope de GetClientsQuery.
export function advisorsManagedBy(users: User[], me: AuthUser): User[] {
  if (isAdmin(me.role)) return users.filter((u) => u.role === Roles.Asesor);
  if (isSupervisor(me.role)) return users.filter((u) => u.role === Roles.Asesor && u.supervisorId === me.id);
  if (isAsesor(me.role)) return users.filter((u) => u.id === me.id);
  return [];
}

export function supervisorUsers(users: User[]): User[] {
  return users.filter((u) => u.role === Roles.Supervisor);
}
