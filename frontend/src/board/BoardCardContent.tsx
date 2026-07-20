import { Avatar } from '../shared/components/Avatar';
import { Badge } from '../shared/components/Badge';
import type { Client } from '../clients/types';
import type { Source } from '../sources/types';
import type { User } from '../users/types';

interface BoardCardContentProps {
  client: Client;
  source?: Source;
  owner?: User;
  showOwner: boolean;
  showHideButton?: boolean;
  onHide?: () => void;
}

export function BoardCardContent({ client, source, owner, showOwner, showHideButton, onHide }: BoardCardContentProps) {
  const fullName = `${client.nombre} ${client.apellidos}`.trim();

  return (
    <>
      <div className="board-card-top">
        <div className="board-card-name">{fullName}</div>
        <div className="board-card-top-actions">
          {showHideButton && (
            <button
              type="button"
              className="board-card-hide-btn"
              title="Ocultar del tablero"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onHide?.();
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                <line x1="4" y1="4" x2="20" y2="20" />
              </svg>
            </button>
          )}
          {showOwner && owner && (
            <Avatar name={owner.name} color={owner.color} size={24} fontSize={10} title={owner.name} />
          )}
        </div>
      </div>
      <div className="board-card-source">
        {source ? <Badge label={source.code} color={source.color} size="sm" /> : '—'}
      </div>
    </>
  );
}
