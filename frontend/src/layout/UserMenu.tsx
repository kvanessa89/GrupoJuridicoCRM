import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleLabel } from '../auth/roles';
import { Avatar } from '../shared/components/Avatar';
import './UserMenu.css';

export function UserMenu({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <div className="user-menu-scrim" onClick={onClose} />
      <div className="user-menu">
        <div className="user-menu-header">
          <Avatar name={user.name} color={user.color} size={38} fontSize={13} />
          <div className="user-menu-header-info">
            <div className="user-menu-name">{user.name}</div>
            <div className="user-menu-role">{roleLabel(user.role)}</div>
          </div>
        </div>
        <div className="user-menu-divider" />
        <div className="user-menu-logout" onClick={handleLogout}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </div>
      </div>
    </>
  );
}
