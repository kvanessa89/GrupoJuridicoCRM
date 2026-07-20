import type { AuthUser } from '../auth/types';
import { Roles, isAdmin, isSupervisor, isAsesor } from '../auth/roles';
import type { User } from './types';
import type { Client } from '../clients/types';

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

// Igual que advisorsManagedBy, pero además incluye a los supervisores que tienen
// clientes asignados directamente a su nombre (ej. clientes registrados por un
// Editor, que se asignan a un supervisor antes de repartirlos a un asesor) — sin
// esto, esos clientes quedaban invisibles en los filtros y desgloses por persona
// del tablero y el panel, aunque sí se contaran en los totales generales.
export function peopleWithClients(users: User[], me: AuthUser, clients: Client[]): User[] {
  const base = advisorsManagedBy(users, me);
  const ownerIdsWithClients = new Set(clients.map((c) => c.ownerId));

  if (isAdmin(me.role)) {
    const supervisorsWithClients = users.filter((u) => u.role === Roles.Supervisor && ownerIdsWithClients.has(u.id));
    return [...base, ...supervisorsWithClients];
  }

  if (isSupervisor(me.role) && ownerIdsWithClients.has(me.id)) {
    const self = users.find((u) => u.id === me.id);
    if (self) return [...base, self];
  }

  return base;
}
