import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { isAdmin, Roles } from '../auth/roles';
import { useHeaderAction } from '../layout/HeaderActionContext';
import { Avatar } from '../shared/components/Avatar';
import { RoleBadge } from '../shared/components/RoleBadge';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { apiErrorMessage } from '../shared/utils/apiError';
import { useUsersQuery, useDeleteUserMutation } from './usersApi';
import { UserModal } from './UserModal';
import './UsersPage.css';

type SortKey = 'usuario' | 'correo' | 'rol' | 'supervisor';

export function UsersPage() {
  const { user } = useAuth();
  const usersQuery = useUsersQuery();

  const [search, setSearch] = useState('');
  const [modalTarget, setModalTarget] = useState<string | null | 'new'>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [reassignToId, setReassignToId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteMutation = useDeleteUserMutation();

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

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
    const filtered = (usersQuery.data ?? []).filter((u) => {
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

    if (!sortKey) return filtered;

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'usuario':
          return a.name.localeCompare(b.name) * dir;
        case 'correo':
          return a.email.localeCompare(b.email) * dir;
        case 'rol':
          return a.role.localeCompare(b.role) * dir;
        case 'supervisor': {
          const sa = a.role === Roles.Asesor ? usersById.get(a.supervisorId ?? '')?.name ?? '' : '';
          const sb = b.role === Roles.Asesor ? usersById.get(b.supervisorId ?? '')?.name ?? '' : '';
          return sa.localeCompare(sb) * dir;
        }
        default:
          return 0;
      }
    });
  }, [usersQuery.data, search, sortKey, sortDir, usersById]);

  const users = usersQuery.data ?? [];
  const deleteTargetUser = deleteTarget ? usersById.get(deleteTarget) : undefined;
  const directReports = deleteTargetUser
    ? users.filter((u) => u.role === Roles.Asesor && u.supervisorId === deleteTargetUser.id)
    : [];

  const needsPicker =
    !!deleteTargetUser &&
    (deleteTargetUser.role === Roles.Supervisor
      ? directReports.length > 0
      : deleteTargetUser.role === Roles.Asesor && !deleteTargetUser.supervisorId);

  const pickerOptions = deleteTargetUser
    ? deleteTargetUser.role === Roles.Supervisor
      ? users.filter((u) => u.role === Roles.Supervisor && u.id !== deleteTargetUser.id)
      : users.filter((u) => u.role === Roles.Supervisor)
    : [];

  const defaultTargetName =
    deleteTargetUser?.role === Roles.Asesor && deleteTargetUser.supervisorId
      ? usersById.get(deleteTargetUser.supervisorId)?.name
      : undefined;

  function openDelete(u: { id: string }) {
    setDeleteTarget(u.id);
    setReassignToId(null);
    setDeleteError(null);
  }

  function closeDelete() {
    setDeleteTarget(null);
    setReassignToId(null);
    setDeleteError(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteMutation.mutate(
      { id: deleteTarget, reassignToUserId: needsPicker ? reassignToId : null },
      {
        onSuccess: () => closeDelete(),
        onError: (err) => setDeleteError(apiErrorMessage(err, 'No se pudo eliminar el usuario. Intenta de nuevo.')),
      },
    );
  }

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
          <div className={`col-usuario th-sortable${sortKey === 'usuario' ? ' th-sortable--active' : ''}`} onClick={() => toggleSort('usuario')}>
            Usuario
            {sortKey === 'usuario' && <span className="th-sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
          </div>
          <div className={`col-correo th-sortable${sortKey === 'correo' ? ' th-sortable--active' : ''}`} onClick={() => toggleSort('correo')}>
            Correo
            {sortKey === 'correo' && <span className="th-sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
          </div>
          <div className={`col-rol th-sortable${sortKey === 'rol' ? ' th-sortable--active' : ''}`} onClick={() => toggleSort('rol')}>
            Rol
            {sortKey === 'rol' && <span className="th-sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
          </div>
          <div className={`col-supervisor th-sortable${sortKey === 'supervisor' ? ' th-sortable--active' : ''}`} onClick={() => toggleSort('supervisor')}>
            Supervisor
            {sortKey === 'supervisor' && <span className="th-sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
          </div>
          {canManage && <div className="col-delete" />}
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
              {canManage && (
                <div className="col-delete">
                  {u.id !== user?.id && (
                    <div
                      className="users-row-delete-icon"
                      title="Eliminar usuario"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDelete(u);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7h16" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" />
                        <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
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

      {deleteTargetUser && (
        <ConfirmDialog
          title="Eliminar usuario"
          isConfirming={deleteMutation.isPending}
          onCancel={closeDelete}
          onConfirm={confirmDelete}
          confirmLabel={needsPicker && !reassignToId ? 'Elige un reemplazo' : 'Eliminar'}
          confirmDisabled={needsPicker && (!reassignToId || pickerOptions.length === 0)}
          message={
            <>
              {deleteTargetUser.role === Roles.Supervisor && directReports.length > 0 && (
                <>
                  <p>
                    <strong>{deleteTargetUser.name}</strong> tiene {directReports.length}{' '}
                    {directReports.length === 1 ? 'asesor asignado' : 'asesores asignados'}. Elige a qué
                    supervisor se reasignarán antes de eliminarlo.
                  </p>
                  {pickerOptions.length === 0 ? (
                    <p className="users-delete-warning">
                      No hay otro supervisor disponible. Crea uno nuevo antes de eliminar a {deleteTargetUser.name}.
                    </p>
                  ) : (
                    <select
                      className="form-select"
                      value={reassignToId ?? ''}
                      onChange={(e) => setReassignToId(e.target.value || null)}
                    >
                      <option value="">Selecciona un supervisor…</option>
                      {pickerOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}

              {deleteTargetUser.role === Roles.Asesor && !deleteTargetUser.supervisorId && (
                <>
                  <p>
                    <strong>{deleteTargetUser.name}</strong> no tiene supervisor asignado. Elige quién recibirá
                    sus clientes antes de eliminarlo.
                  </p>
                  <select
                    className="form-select"
                    value={reassignToId ?? ''}
                    onChange={(e) => setReassignToId(e.target.value || null)}
                  >
                    <option value="">Selecciona un supervisor…</option>
                    {pickerOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {deleteTargetUser.role === Roles.Asesor && deleteTargetUser.supervisorId && (
                <p>
                  ¿Eliminar a <strong>{deleteTargetUser.name}</strong>? Sus clientes pasarán a{' '}
                  <strong>{defaultTargetName ?? 'su supervisor'}</strong>.
                </p>
              )}

              {(deleteTargetUser.role === Roles.Admin || deleteTargetUser.role === Roles.Editor) && (
                <p>
                  ¿Seguro que quieres eliminar a <strong>{deleteTargetUser.name}</strong>? Esta acción no se
                  puede deshacer.
                </p>
              )}

              {deleteTargetUser.role === Roles.Supervisor && directReports.length === 0 && (
                <p>
                  ¿Seguro que quieres eliminar a <strong>{deleteTargetUser.name}</strong>? Esta acción no se
                  puede deshacer.
                </p>
              )}

              {deleteError && <p className="users-delete-error">{deleteError}</p>}
            </>
          }
        />
      )}
    </div>
  );
}
