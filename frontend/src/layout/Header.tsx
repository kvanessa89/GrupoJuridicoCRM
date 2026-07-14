import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../shared/components/Avatar';
import { roleLabel } from '../auth/roles';
import { sectionMetaFor } from './sectionMeta';
import { UserMenu } from './UserMenu';
import './Header.css';

interface HeaderProps {
  onToggleSidebar: () => void;
  action: ReactNode;
}

export function Header({ onToggleSidebar, action }: HeaderProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;

  const { title, subtitle } = sectionMetaFor(location.pathname, user.role);

  return (
    <header className="app-header">
      <button className="header-menu-btn" onClick={onToggleSidebar} aria-label="Abrir menú">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="header-titles">
        <div className="header-title">{title}</div>
        {subtitle && <div className="header-subtitle">{subtitle}</div>}
      </div>

      {action}

      <div className="header-divider" />

      <div className="header-user-chip" onClick={() => setMenuOpen((v) => !v)}>
        <Avatar name={user.name} color={user.color} size={34} fontSize={12.5} />
        <div className="header-chip-text">
          <div className="header-user-name">{user.name}</div>
          <div className="header-user-role">{roleLabel(user.role)}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-chip-text">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {menuOpen && <UserMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}
