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
}

export function BoardCardContent({ client, source, owner, showOwner }: BoardCardContentProps) {
  const fullName = `${client.nombre} ${client.apellidos}`.trim();

  return (
    <>
      <div className="board-card-top">
        <div className="board-card-name">{fullName}</div>
        {showOwner && owner && (
          <Avatar name={owner.name} color={owner.color} size={24} fontSize={10} title={owner.name} />
        )}
      </div>
      <div className="board-card-source">
        {source ? <Badge label={source.code} color={source.color} size="sm" /> : '—'}
      </div>
    </>
  );
}
