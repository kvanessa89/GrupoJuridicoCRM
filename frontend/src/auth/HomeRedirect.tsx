import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { homeRouteFor } from './homeRoute';

export function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeRouteFor(user.role)} replace />;
}
