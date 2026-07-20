import { useEffect, useState } from 'react';
import { Modal } from '../shared/components/Modal';
import { Avatar } from '../shared/components/Avatar';
import { Roles, roleLabel, type Role } from '../auth/roles';
import { supervisorUsers } from './teamHelpers';
import { useCreateUserMutation, useUpdateUserMutation, useUsersQuery } from './usersApi';
import type { UserFormValues } from './types';
import { apiErrorMessage } from '../shared/utils/apiError';
import { PALETTE } from '../shared/utils/palette';
import { isValidEmail } from '../shared/utils/validation';
import './UserModal.css';

const ROLE_OPTIONS: Role[] = [Roles.Admin, Roles.Supervisor, Roles.Editor, Roles.Asesor];

interface UserModalProps {
  userId: string | null;
  onClose: () => void;
}

export function UserModal({ userId, onClose }: UserModalProps) {
  const usersQuery = useUsersQuery();
  const users = usersQuery.data ?? [];
  const existing = userId ? users.find((u) => u.id === userId) : undefined;

  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();

  const isEdit = !!userId;
  const dataReady = usersQuery.isSuccess && (!userId || !!existing);

  const [form, setForm] = useState<UserFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (form || !dataReady) return;

    if (existing) {
      setForm({
        name: existing.name,
        title: existing.title ?? '',
        email: existing.email,
        password: '',
        role: existing.role,
        color: existing.color,
        supervisorId: existing.supervisorId,
      });
      return;
    }

    setForm({
      name: '',
      title: '',
      email: '',
      password: '',
      role: Roles.Asesor,
      color: PALETTE[0],
      supervisorId: supervisorUsers(users)[0]?.id ?? null,
    });
  }, [dataReady]);

  if (!dataReady && userId) return null;

  const canSave =
    !!form &&
    form.name.trim().length > 0 &&
    (isEdit || (isValidEmail(form.email) && form.password.length > 0));
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function set<K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) {
    setForm((f) => (f ? { ...f, [field]: value } : f));
  }

  async function handleSave() {
    if (!form || !canSave) return;
    setError(null);
    try {
      if (!userId) {
        await createMutation.mutateAsync(form);
      } else {
        await updateMutation.mutateAsync({ id: userId, form });
      }
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo guardar el usuario. Intenta de nuevo.'));
    }
  }

  return (
    <Modal onClose={onClose} width={480}>
      <div className="modal-header">
        <div className="modal-title">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</div>
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>

      <div className="modal-body">
        {error && <div className="modal-error-text">{error}</div>}
        {!form ? (
          <div className="modal-loading">Cargando…</div>
        ) : (
          <>
            <div className="user-modal-avatar-row">
              <Avatar name={form.name || '?'} color={form.color} size={44} fontSize={15} />
              <div className="user-modal-colors">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`user-modal-color${c === form.color ? ' user-modal-color--selected' : ''}`}
                    style={{ background: c }}
                    aria-label={c}
                    onClick={() => set('color', c)}
                  />
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="user-name">
                  Nombre <span className="required-asterisk">*</span>
                </label>
                <input
                  id="user-name"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  maxLength={25}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="user-title">
                  Puesto
                </label>
                <input
                  id="user-title"
                  className="form-input"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  maxLength={30}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="user-email">
                Correo {!isEdit && <span className="required-asterisk">*</span>}
              </label>
              <input
                id="user-email"
                className="form-input"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                readOnly={isEdit}
                maxLength={50}
              />
              {!isEdit && form.email.trim().length > 0 && !isValidEmail(form.email) && (
                <div className="modal-error-text">Ingresa un correo electrónico válido.</div>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="user-password">
                {isEdit ? 'Nueva contraseña' : 'Contraseña'}{' '}
                {!isEdit && <span className="required-asterisk">*</span>}
              </label>
              <div className="user-password-wrap">
                <input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder={isEdit ? 'Dejar en blanco para no cambiarla' : undefined}
                  maxLength={50}
                />
                <button
                  type="button"
                  className="user-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.6 20.6 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.6 20.6 0 0 1-3.22 4.53" />
                      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="user-role">
                  Rol
                </label>
                <select
                  id="user-role"
                  className="form-select"
                  value={form.role}
                  onChange={(e) => set('role', e.target.value as Role)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
              </div>
              {form.role === Roles.Asesor && (
                <div className="form-field">
                  <label className="form-label" htmlFor="user-supervisor">
                    Supervisor
                  </label>
                  <select
                    id="user-supervisor"
                    className="form-select"
                    value={form.supervisorId ?? ''}
                    onChange={(e) => set('supervisorId', e.target.value || null)}
                  >
                    {supervisorUsers(users).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSave || isSaving}>
          {isSaving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar usuario'}
        </button>
      </div>
    </Modal>
  );
}
