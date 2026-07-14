import { useMemo, useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { LayoutContextValue } from './HeaderActionContext';
import './AppLayout.css';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerAction, setHeaderAction] = useState<ReactNode | null>(null);

  const context: LayoutContextValue = useMemo(() => ({ setHeaderAction }), []);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} action={headerAction} />
        <div className="app-content">
          <Outlet context={context} />
        </div>
      </div>
    </div>
  );
}
