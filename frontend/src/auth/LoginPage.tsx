import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoUrl from '../assets/logo-grupo-juridico.png';
import asideBgUrl from '../assets/login-aside-bg.png';
import { useAuth } from './AuthContext';
import { homeRouteFor } from './homeRoute';
import { apiErrorMessage } from '../shared/utils/apiError';
import './LoginPage.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin() {
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
      navigate(homeRouteFor(user.role), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo iniciar sesión. Verifica tus datos.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div
        className="login-aside"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(11,18,32,.94), rgba(11,18,32,.78) 55%, rgba(11,18,32,.42)), url(${asideBgUrl})`,
        }}
      >
        <div className="login-aside-top">
          <div className="login-logo">
            <img src={logoUrl} alt="Grupo Jurídico" />
          </div>
          <div>
            <div className="login-brand-title">Grupo Jurídico CRM</div>
            <div className="login-brand-rule" />
            <div className="login-brand-tagline">Paramos tu remate</div>
          </div>
        </div>
        <div className="login-aside-bottom">
          <h1>Cada cliente en su lugar, de la primera llamada al cierre.</h1>
          <div className="login-brand-rule login-brand-rule--lg" />
          <p>
            Organiza a tus clientes por etapa, arrástralos por el tablero y mantén a todo tu equipo alineado.
          </p>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-inner">
          <div className="login-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2 4 5v6c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V5l-8-3Z" />
            </svg>
          </div>
          <h2 className="login-heading">Bienvenido de nuevo</h2>
          <p className="login-subtitle">Inicia sesión para continuar</p>

          <label className="login-label" htmlFor="login-email">
            Correo electrónico
          </label>
          <div className="login-input-wrap">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="login-input-icon login-input-icon--left"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <input
              id="login-email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoComplete="email"
            />
          </div>

          <label className="login-label" htmlFor="login-password">
            Contraseña
          </label>
          <div className="login-input-wrap login-input-wrap--password">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="login-input-icon login-input-icon--left"
            >
              <rect x="4" y="10.5" width="16" height="10" rx="2" />
              <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
            </svg>
            <input
              id="login-password"
              className="login-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-input-icon login-input-icon--right"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.6 20.6 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.6 20.6 0 0 1-3.22 4.53" />
                  <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <div className="login-row-between">
            <label className="login-remember">
              <input type="checkbox" />
              Recordarme
            </label>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-submit" onClick={handleLogin} disabled={isSubmitting}>
            <span>{isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}</span>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </button>

          <div className="login-secure-note">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2 4 5v6c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V5l-8-3Z" />
            </svg>
            Acceso seguro y protegido
          </div>
        </div>
      </div>
    </div>
  );
}
