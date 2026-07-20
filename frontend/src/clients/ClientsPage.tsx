import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { canFilterTeam, isAdmin, isEditor } from '../auth/roles';
import { useHeaderAction } from '../layout/HeaderActionContext';
import { Avatar } from '../shared/components/Avatar';
import { Badge } from '../shared/components/Badge';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { fmtDateShort } from '../shared/utils/format';
import { useStagesQuery } from '../stages/stagesApi';
import { useSourcesQuery } from '../sources/sourcesApi';
import { useUsersQuery } from '../users/usersApi';
import { useClientsQuery, useDeleteClientMutation, useSetBoardVisibilityMutation } from './useClients';
import { ClientModal } from './ClientModal';
import './ClientsPage.css';

type SortKey = 'cliente' | 'origen' | 'etapa' | 'asesor';

export function ClientsPage() {
  const { user } = useAuth();
  const clientsQuery = useClientsQuery();
  const stagesQuery = useStagesQuery();
  const sourcesQuery = useSourcesQuery();
  const usersQuery = useUsersQuery();
  const deleteMutation = useDeleteClientMutation();
  const visibilityMutation = useSetBoardVisibilityMutation();

  const [search, setSearch] = useState('');
  const [modalTarget, setModalTarget] = useState<number | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const canCreate = !!user && (canFilterTeam(user.role) || isEditor(user.role));
  const canDelete = !!user && canFilterTeam(user.role);
  const canManageVisibility = canDelete;
  const showAsesorCol = !!user && isAdmin(user.role);

  const headerAction = useMemo(
    () =>
      canCreate ? (
        <button className="header-add-btn" onClick={() => setModalTarget('new')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nuevo cliente</span>
        </button>
      ) : null,
    [canCreate],
  );
  useHeaderAction(headerAction);

  const stagesById = useMemo(
    () => new Map((stagesQuery.data ?? []).map((s) => [s.id, s])),
    [stagesQuery.data],
  );
  const sourcesById = useMemo(
    () => new Map((sourcesQuery.data ?? []).map((s) => [s.id, s])),
    [sourcesQuery.data],
  );
  const usersById = useMemo(
    () => new Map((usersQuery.data ?? []).map((u) => [u.id, u])),
    [usersQuery.data],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (clientsQuery.data ?? []).filter((c) => {
      if (!q) return true;
      return (
        `${c.nombre} ${c.apellidos}`.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q)
      );
    });

    if (!sortKey) return filtered;

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'cliente':
          return `${a.nombre} ${a.apellidos}`.trim().localeCompare(`${b.nombre} ${b.apellidos}`.trim()) * dir;
        case 'origen':
          return (sourcesById.get(a.sourceId)?.label ?? '').localeCompare(sourcesById.get(b.sourceId)?.label ?? '') * dir;
        case 'etapa':
          return ((stagesById.get(a.stageId)?.order ?? 0) - (stagesById.get(b.stageId)?.order ?? 0)) * dir;
        case 'asesor':
          return (usersById.get(a.ownerId)?.name ?? '').localeCompare(usersById.get(b.ownerId)?.name ?? '') * dir;
        default:
          return 0;
      }
    });
  }, [clientsQuery.data, search, sortKey, sortDir, sourcesById, stagesById, usersById]);

  const deleteTargetClient = deleteTarget ? clientsQuery.data?.find((c) => c.id === deleteTarget) : undefined;

  return (
    <div className="clients-page">
      <div className="clients-toolbar">
        <div className="clients-search">
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
        <span className="clients-count">{rows.length} clientes</span>
      </div>

      <div className="clients-table">
        <div className="clients-table-head">
          <div className={`col-cliente th-sortable${sortKey === 'cliente' ? ' th-sortable--active' : ''}`} onClick={() => toggleSort('cliente')}>
            Cliente
            {sortKey === 'cliente' && <span className="th-sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
          </div>
          <div className="col-contacto">Contacto</div>
          <div className={`col-origen th-sortable${sortKey === 'origen' ? ' th-sortable--active' : ''}`} onClick={() => toggleSort('origen')}>
            Origen
            {sortKey === 'origen' && <span className="th-sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
          </div>
          <div className={`col-etapa th-sortable${sortKey === 'etapa' ? ' th-sortable--active' : ''}`} onClick={() => toggleSort('etapa')}>
            Etapa
            {sortKey === 'etapa' && <span className="th-sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
          </div>
          {showAsesorCol && (
            <div className={`col-asesor th-sortable${sortKey === 'asesor' ? ' th-sortable--active' : ''}`} onClick={() => toggleSort('asesor')}>
              Asesor
              {sortKey === 'asesor' && <span className="th-sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
            </div>
          )}
          {canDelete && <div className="col-delete" />}
        </div>

        {rows.map((c) => {
          const owner = usersById.get(c.ownerId);
          const source = sourcesById.get(c.sourceId);
          const stage = stagesById.get(c.stageId);
          const fullName = `${c.nombre} ${c.apellidos}`.trim();
          return (
            <div
              key={c.id}
              className="clients-row"
              title="Editar cliente"
              onClick={() => setModalTarget(c.id)}
            >
              <div className="col-cliente clients-row-main">
                <Avatar name={fullName} color={owner?.color ?? '#94A3B8'} size={32} fontSize={11.5} />
                <div className="clients-row-main-text">
                  <div className="clients-row-name">{fullName}</div>
                  <div className="clients-row-ingreso">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 7 12 12 15.5 14" />
                    </svg>
                    {fmtDateShort(c.createdAt)}
                  </div>
                </div>
              </div>
              <div className="col-contacto clients-row-contact">
                <div className="clients-row-email">{c.email || '—'}</div>
                <div className="clients-row-phone">{c.telefono || '—'}</div>
              </div>
              <div className="col-origen">
                {source ? <Badge label={source.code} color={source.color} size="sm" /> : '—'}
              </div>
              <div className="col-etapa">
                {stage ? <Badge label={stage.name} color={stage.color} size="md" /> : '—'}
                {c.hiddenFromBoard && <span className="clients-hidden-badge">Oculto del tablero</span>}
              </div>
              {showAsesorCol && (
                <div className="col-asesor clients-row-owner">
                  {owner && <Avatar name={owner.name} color={owner.color} size={26} fontSize={10.5} />}
                  <span>{owner?.name ?? '—'}</span>
                </div>
              )}
              {(canDelete || canManageVisibility) && (
                <div className="col-delete clients-row-actions">
                  {canManageVisibility && (
                    // Reserva el espacio del ícono siempre (aunque no esté oculto) para que
                    // col-delete tenga el mismo ancho en todas las filas y no desalinee las demás columnas.
                    <div
                      className={`clients-row-restore-icon${c.hiddenFromBoard ? '' : ' clients-row-restore-icon--placeholder'}`}
                      title={c.hiddenFromBoard ? 'Restaurar al tablero' : undefined}
                      onClick={(e) => {
                        if (!c.hiddenFromBoard) return;
                        e.stopPropagation();
                        visibilityMutation.mutate({ id: c.id, hidden: false });
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                  )}
                  {canDelete && (
                    <div
                      className="clients-row-delete-icon"
                      title="Eliminar cliente"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(c.id);
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

        {clientsQuery.isSuccess && rows.length === 0 && (
          <div className="clients-empty">No se encontraron clientes.</div>
        )}
      </div>

      {modalTarget !== null && (
        <ClientModal
          clientId={modalTarget === 'new' ? null : modalTarget}
          onClose={() => setModalTarget(null)}
        />
      )}

      {deleteTarget && deleteTargetClient && (
        <ConfirmDialog
          title="Eliminar cliente"
          message={
            <>
              ¿Seguro que quieres eliminar a{' '}
              <strong>{`${deleteTargetClient.nombre} ${deleteTargetClient.apellidos}`.trim() || 'este cliente'}</strong>?
              Esta acción no se puede deshacer y se perderán sus comentarios e historial.
            </>
          }
          isConfirming={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })}
        />
      )}
    </div>
  );
}
