// Mirrors GrupoJuridico.Crm.Domain.Constants.Roles on the backend — keep in sync.
export const Roles = {
  Admin: 'Admin',
  Supervisor: 'Supervisor',
  Editor: 'Editor',
  Asesor: 'Asesor',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export function isAdmin(role: Role): boolean {
  return role === Roles.Admin;
}

export function isSupervisor(role: Role): boolean {
  return role === Roles.Supervisor;
}

export function isEditor(role: Role): boolean {
  return role === Roles.Editor;
}

export function isAsesor(role: Role): boolean {
  return role === Roles.Asesor;
}

// Admin y Supervisor pueden filtrar el tablero/panel por asesor, ver el equipo, etc.
export function canFilterTeam(role: Role): boolean {
  return isAdmin(role) || isSupervisor(role);
}

export function roleLabel(role: Role): string {
  switch (role) {
    case Roles.Admin:
      return 'Administrador';
    case Roles.Supervisor:
      return 'Supervisor';
    case Roles.Editor:
      return 'Editor';
    case Roles.Asesor:
      return 'Asesor';
  }
}
