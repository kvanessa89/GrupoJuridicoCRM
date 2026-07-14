import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { isAdmin, Roles } from '../auth/roles';
import { useHeaderAction } from '../layout/HeaderActionContext';
import { Avatar } from '../shared/components/Avatar';
import { RoleBadge } from '../shared/components/RoleBadge';
import { useUsersQuery } from './usersApi';
import { UserModal } from './UserModal';
import './UsersPage.css';

export function UsersPage() {
  const { user } = useAuth();
  const usersQuery = useUsersQuery();

  const [search, setSearch] = useState('');
  const [modalTarget, setModalTarget] = useState<string | null | 'new'>(null);

  const canManage = !!user && isAdmin(user.role);

  const headerAction = useMemo(
    () =>
      canManage ? (
        <button className="header-add-btn" onClick={() => setModalTarget('new')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nuevo usuario</span>
        </button>
      ) : null,
    [canManage],
  );
  useHeaderAction(headerAction);

  const usersById = useMemo(
    () => new Map((usersQuery.data ?? []).map((u) => [u.id, u])),
    [usersQuery.data],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (usersQuery.data ?? []).filter((u) => {
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [usersQuery.data, search]);

  return (
    <div className="users-page">
      <div className="users-toolbar">
        <div className="users-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
          />
        </div>
        <span className="users-count">{rows.length} usuarios</span>
      </div>

      <div className="users-table">
        <div className="users-table-head">
          <div className="col-usuario">Usuario</div>
          <div className="col-correo">Correo</div>
          <div className="col-rol">Rol</div>
          <div className="col-supervisor">Supervisor</div>
        </div>

        {rows.map((u) => {
          const supervisor = u.supervisorId ? usersById.get(u.supervisorId) : undefined;
          return (
            <div
              key={u.id}
              className={`users-row${canManage ? '' : ' users-row--static'}`}
              title={canManage ? 'Editar usuario' : undefined}
              onClick={canManage ? () => setModalTarget(u.id) : undefined}
            >
              <div className="col-usuario users-row-main">
                <Avatar name={u.name} color={u.color} size={32} fontSize={11.5} />
                <div className="users-row-main-text">
                  <div className="users-row-name">{u.name}</div>
                  {u.title && <div className="users-row-title">{u.title}</div>}
                </div>
              </div>
              <div className="col-correo users-row-email">{u.email}</div>
              <div className="col-rol">
                <RoleBadge role={u.role} />
              </div>
              <div className="col-supervisor users-row-supervisor">
                {u.role === Roles.Asesor ? supervisor?.name ?? '—' : '—'}
              </div>
            </div>
          );
        })}

        {usersQuery.isSuccess && rows.length === 0 && (
          <div className="users-empty">No se encontraron usuarios.</div>
        )}
      </div>

      {modalTarget !== null && (
        <UserModal
          userId={modalTarget === 'new' ? null : modalTarget}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
