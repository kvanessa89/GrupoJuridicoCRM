import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Role } from './roles';
import { homeRouteFor } from './homeRoute';

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth();
  const context = useOutletContext();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeRouteFor(user.role)} replace />;
  return <Outlet context={context} />;
}
