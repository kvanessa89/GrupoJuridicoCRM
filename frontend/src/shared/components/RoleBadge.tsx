import { Roles, roleLabel, type Role } from '../../auth/roles';
import './RoleBadge.css';

const ROLE_COLORS: Record<Role, { bg: string; fg: string }> = {
  [Roles.Admin]: { bg: '#EEF4FF', fg: 'var(--color-accent)' },
  [Roles.Supervisor]: { bg: '#F3EEFF', fg: '#7C3AED' },
  [Roles.Editor]: { bg: '#FEF3E2', fg: '#D97706' },
  [Roles.Asesor]: { bg: '#F1F5F9', fg: '#64748B' },
};

export function RoleBadge({ role }: { role: Role }) {
  const { bg, fg } = ROLE_COLORS[role];
  return (
    <span className="role-badge" style={{ background: bg, color: fg }}>
      {roleLabel(role)}
    </span>
  );
}
