import { useDraggable } from '@dnd-kit/core';
import { BoardCardContent } from './BoardCardContent';
import type { Client } from '../clients/types';
import type { Source } from '../sources/types';
import type { User } from '../users/types';

interface BoardCardProps {
  client: Client;
  source?: Source;
  owner?: User;
  showOwner: boolean;
  stageColor: string;
  onClick: () => void;
}

export function BoardCard({ client, source, owner, showOwner, stageColor, onClick }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: client.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="board-card"
      style={{ borderLeftColor: stageColor, opacity: isDragging ? 0.4 : 1 }}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <BoardCardContent client={client} source={source} owner={owner} showOwner={showOwner} />
    </div>
  );
}
