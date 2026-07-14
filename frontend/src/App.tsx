import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RequireRole } from './auth/RequireRole';
import { HomeRedirect } from './auth/HomeRedirect';
import { Roles } from './auth/roles';
import { AppLayout } from './layout/AppLayout';
import { PanelPage } from './dashboard/PanelPage';
import { BoardPage } from './board/BoardPage';
import { ClientsPage } from './clients/ClientsPage';
import { UsersPage } from './users/UsersPage';
import { ConfigPage } from './config/ConfigPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<HomeRedirect />} />
              <Route path="panel" element={<PanelPage />} />
              <Route path="tablero" element={<BoardPage />} />
              <Route path="clientes" element={<ClientsPage />} />

              <Route element={<RequireRole roles={[Roles.Admin]} />}>
                <Route path="usuarios" element={<UsersPage />} />
                <Route path="configuracion" element={<ConfigPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
