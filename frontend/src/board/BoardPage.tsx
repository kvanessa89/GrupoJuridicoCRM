import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useAuth } from '../auth/AuthContext';
import { canFilterTeam } from '../auth/roles';
import { useHeaderAction } from '../layout/HeaderActionContext';
import { ClientModal } from '../clients/ClientModal';
import { useClientsQuery, useMoveClientMutation } from '../clients/useClients';
import { useStagesQuery } from '../stages/stagesApi';
import { useSourcesQuery } from '../sources/sourcesApi';
import { useUsersQuery } from '../users/usersApi';
import { advisorsManagedBy } from '../users/teamHelpers';
import { BoardColumn } from './BoardColumn';
import { BoardCardContent } from './BoardCardContent';
import './BoardPage.css';

export function BoardPage() {
  const { user } = useAuth();
  const clientsQuery = useClientsQuery();
  const stagesQuery = useStagesQuery();
  const sourcesQuery = useSourcesQuery();
  const usersQuery = useUsersQuery();
  const moveMutation = useMoveClientMutation();

  const [filterId, setFilterId] = useState<string>('all');
  const [modalTarget, setModalTarget] = useState<number | null | 'new'>(null);
  const [newClientStageId, setNewClientStageId] = useState<number | undefined>(undefined);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const columnRefs = useRef(new Map<number, HTMLDivElement | null>());

  const canFilter = !!user && canFilterTeam(user.role);
  const clients = clientsQuery.data ?? [];
  const stages = stagesQuery.data ?? [];
  const sources = sourcesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const headerAction = useMemo(
    () =>
      canFilter ? (
        <button
          className="header-add-btn"
          onClick={() => {
            setNewClientStageId(undefined);
            setModalTarget('new');
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nuevo cliente</span>
        </button>
      ) : null,
    [canFilter],
  );
  useHeaderAction(headerAction);

  const managedAdvisors = useMemo(() => (user ? advisorsManagedBy(users, user) : []), [users, user]);

  const sourcesById = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const stagesById = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);

  const boardScope = useMemo(() => {
    if (canFilter && filterId !== 'all') return clients.filter((c) => c.ownerId === filterId);
    return clients;
  }, [clients, canFilter, filterId]);

  const showOwnerOnCard = canFilter && filterId === 'all';

  const cardsByStage = useMemo(() => {
    const sorted = [...boardScope].sort(
      (a, b) => new Date(a.stageEnteredAt).getTime() - new Date(b.stageEnteredAt).getTime(),
    );
    const m = new Map<number, typeof clients>();
    for (const c of sorted) {
      const list = m.get(c.stageId);
      if (list) list.push(c);
      else m.set(c.stageId, [c]);
    }
    return m;
  }, [boardScope]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const activeCard = activeCardId ? clients.find((c) => c.id === activeCardId) : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(event.active.id as number);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCardId(null);
    if (!over) return;
    const clientId = active.id as number;
    const newStageId = over.id as number;
    const current = clients.find((c) => c.id === clientId);
    if (!current || current.stageId === newStageId) return;
    moveMutation.mutate({ id: clientId, stageId: newStageId });
    // Deferred to the next frame: dnd-kit's own auto-scroll (used to reach a
    // distant column) clears its scroll interval via a React re-render, which
    // can still land a residual scrollBy after this handler returns. Waiting
    // a frame ensures our scroll wins that race.
    requestAnimationFrame(() => {
      columnRefs.current.get(newStageId)?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
    });
  }

  return (
    <div className="board-page">
      {canFilter && (
        <div className="board-filter">
          <span className="board-filter-label">Ver tablero de:</span>
          <button
            className={`board-filter-chip${filterId === 'all' ? ' board-filter-chip--active' : ''}`}
            onClick={() => setFilterId('all')}
          >
            Todos
          </button>
          {managedAdvisors.map((a) => (
            <button
              key={a.id}
              className={`board-filter-chip${filterId === a.id ? ' board-filter-chip--active' : ''}`}
              onClick={() => setFilterId(a.id)}
            >
              {a.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div className={`board-scroll${activeCardId !== null ? ' board-scroll--dragging' : ''}`}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="board-columns">
            {stages.map((stage) => (
              <BoardColumn
                key={stage.id}
                stage={stage}
                cards={cardsByStage.get(stage.id) ?? []}
                sourcesById={sourcesById}
                usersById={usersById}
                showOwner={showOwnerOnCard}
                canAdd={canFilter}
                onAddClient={() => {
                  setNewClientStageId(stage.id);
                  setModalTarget('new');
                }}
                onCardClick={(id) => setModalTarget(id)}
                registerRef={(node) => columnRefs.current.set(stage.id, node)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard && (
              <div
                className="board-card board-card--overlay"
                style={{ borderLeftColor: stagesById.get(activeCard.stageId)?.color ?? '#94a3b8' }}
              >
                <BoardCardContent
                  client={activeCard}
                  source={sourcesById.get(activeCard.sourceId)}
                  owner={usersById.get(activeCard.ownerId)}
                  showOwner={showOwnerOnCard}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {modalTarget !== null && (
        <ClientModal
          clientId={modalTarget === 'new' ? null : modalTarget}
          initialStageId={newClientStageId}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
