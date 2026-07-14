import { NavLink } from 'react-router-dom';
import { Avatar } from '../shared/components/Avatar';
import { isAdmin, isEditor, roleLabel } from '../auth/roles';
import { useAuth } from '../auth/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { user } = useAuth();
  if (!user) return null;

  const showWorkspaceNav = !isEditor(user.role);
  const showUsersNav = isAdmin(user.role);
  const showConfigNav = isAdmin(user.role);

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onNavigate} />}
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="sidebar-brand">Grupo Jurídico CRM</div>

        <nav className="sidebar-nav">
          {showWorkspaceNav && (
            <NavLink
              to="/panel"
              onClick={onNavigate}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
              </svg>
              <span>Panel</span>
            </NavLink>
          )}
          {showWorkspaceNav && (
            <NavLink
              to="/tablero"
              onClick={onNavigate}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="5" height="16" rx="1.5" />
                <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
                <rect x="16" y="4" width="5" height="14" rx="1.5" />
              </svg>
              <span>Tablero</span>
            </NavLink>
          )}
          <NavLink
            to="/clientes"
            onClick={onNavigate}
            className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="3.2" />
              <path d="M22 19v-2a4 4 0 0 0-3-3.85" />
              <path d="M16 3.6A4 4 0 0 1 16 11" />
            </svg>
            <span>Clientes</span>
          </NavLink>
          {showUsersNav && (
            <NavLink
              to="/usuarios"
              onClick={onNavigate}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 4 5v6c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V5l-8-3Z" />
                <circle cx="12" cy="10" r="2.2" />
                <path d="M8.5 16c.6-1.6 2-2.4 3.5-2.4s2.9.8 3.5 2.4" />
              </svg>
              <span>Usuarios</span>
            </NavLink>
          )}
          {showConfigNav && (
            <NavLink
              to="/configuracion"
              onClick={onNavigate}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <circle cx="9" cy="6" r="2.2" fill="#0A0A0A" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <circle cx="15" cy="12" r="2.2" fill="#0A0A0A" />
                <line x1="4" y1="18" x2="20" y2="18" />
                <circle cx="8" cy="18" r="2.2" fill="#0A0A0A" />
              </svg>
              <span>Config. del tablero</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <Avatar name={user.name} color={user.color} size={34} fontSize={12.5} />
          <div className="sidebar-footer-info">
            <div className="sidebar-footer-name">{user.name}</div>
            <div className="sidebar-footer-role">{roleLabel(user.role)}</div>
          </div>
        </div>
      </aside>
    </>
  );
}
