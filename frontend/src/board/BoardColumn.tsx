import { useDroppable } from '@dnd-kit/core';
import { BoardCard } from './BoardCard';
import type { Stage } from '../stages/types';
import type { Client } from '../clients/types';
import type { Source } from '../sources/types';
import type { User } from '../users/types';

interface BoardColumnProps {
  stage: Stage;
  cards: Client[];
  sourcesById: Map<number, Source>;
  usersById: Map<string, User>;
  showOwner: boolean;
  canAdd: boolean;
  onAddClient: () => void;
  onCardClick: (id: number) => void;
  registerRef?: (node: HTMLDivElement | null) => void;
}

export function BoardColumn({
  stage,
  cards,
  sourcesById,
  usersById,
  showOwner,
  canAdd,
  onAddClient,
  onCardClick,
  registerRef,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        registerRef?.(node);
      }}
      className={`board-column${isOver ? ' board-column--over' : ''}`}
      style={{ borderTopColor: stage.color }}
    >
      <div className="board-column-header">
        <span className="board-column-name">{stage.name}</span>
        <span className="board-column-count">{cards.length}</span>
      </div>
      <div className="board-column-list">
        {cards.map((c) => (
          <BoardCard
            key={c.id}
            client={c}
            source={sourcesById.get(c.sourceId)}
            owner={usersById.get(c.ownerId)}
            showOwner={showOwner}
            stageColor={stage.color}
            onClick={() => onCardClick(c.id)}
          />
        ))}
        {cards.length === 0 && <div className="board-column-empty">Arrastra clientes aquí</div>}
        {canAdd && (
          <button type="button" className="board-column-add" onClick={onAddClient}>
            + Añadir cliente
          </button>
        )}
      </div>
    </div>
  );
}
