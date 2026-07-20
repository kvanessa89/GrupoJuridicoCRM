import { useEffect, useState } from 'react';
import { Modal } from '../shared/components/Modal';
import { Avatar } from '../shared/components/Avatar';
import { useAuth } from '../auth/AuthContext';
import { canFilterTeam, isAdmin, isEditor } from '../auth/roles';
import { useStagesQuery } from '../stages/stagesApi';
import { useSourcesQuery } from '../sources/sourcesApi';
import { useUsersQuery } from '../users/usersApi';
import { advisorsManagedBy, supervisorUsers } from '../users/teamHelpers';
import { fmtDateShort, fmtDateTime } from '../shared/utils/format';
import {
  useAddCommentMutation,
  useClientCommentsQuery,
  useClientsQuery,
  useCreateClientMutation,
  useMoveClientMutation,
  useUpdateClientMutation,
} from './useClients';
import type { ClientFormValues } from './types';
import { apiErrorMessage } from '../shared/utils/apiError';
import { isValidEmail } from '../shared/utils/validation';
import './ClientModal.css';

interface ClientModalProps {
  clientId: number | null;
  onClose: () => void;
  initialStageId?: number;
}

export function ClientModal({ clientId, onClose, initialStageId }: ClientModalProps) {
  const { user } = useAuth();
  const { data: clients } = useClientsQuery();
  const stagesQuery = useStagesQuery();
  const sourcesQuery = useSourcesQuery();
  const usersQuery = useUsersQuery();
  const commentsQuery = useClientCommentsQuery(clientId);

  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();
  const moveMutation = useMoveClientMutation();
  const addCommentMutation = useAddCommentMutation(clientId);

  const existing = clientId ? clients?.find((c) => c.id === clientId) : undefined;
  const stages = stagesQuery.data ?? [];
  const sources = sourcesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const dataReady =
    stagesQuery.isSuccess && sourcesQuery.isSuccess && usersQuery.isSuccess && (!clientId || !!existing);

  const [form, setForm] = useState<ClientFormValues | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (form || !dataReady || !user) return;

    if (existing) {
      setForm({
        nombre: existing.nombre,
        apellidos: existing.apellidos,
        email: existing.email ?? '',
        telefono: existing.telefono ?? '',
        whatsapp: existing.whatsapp ?? '',
        sourceId: existing.sourceId,
        stageId: existing.stageId,
        ownerId: existing.ownerId,
      });
      return;
    }

    let ownerId = user.id;
    if (isEditor(user.role) || isAdmin(user.role)) {
      ownerId = supervisorUsers(users)[0]?.id ?? user.id;
    } else if (canFilterTeam(user.role)) {
      ownerId = advisorsManagedBy(users, user)[0]?.id ?? user.id;
    }
    setForm({
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      whatsapp: '',
      sourceId: sources[0]?.id ?? '',
      stageId: initialStageId ?? stages[0]?.id ?? '',
      ownerId,
    });
  }, [dataReady]);

  if (!user) return null;

  const isEdit = !!clientId;
  const canEditBasics = canFilterTeam(user.role) || isEditor(user.role);
  const showOwner = canEditBasics;
  const assignsToSupervisor = isEditor(user.role) || (isAdmin(user.role) && !isEdit);
  const baseOwnerOptions = assignsToSupervisor ? supervisorUsers(users) : advisorsManagedBy(users, user);
  const currentOwner = existing ? users.find((u) => u.id === existing.ownerId) : undefined;
  const ownerOptions =
    currentOwner && !baseOwnerOptions.some((o) => o.id === currentOwner.id)
      ? [currentOwner, ...baseOwnerOptions]
      : baseOwnerOptions;
  const ownerLabel = 'Asignado a';
  const canSave =
    !!form &&
    form.nombre.trim().length > 0 &&
    isValidEmail(form.email) &&
    form.whatsapp.trim().length > 0;
  const isSaving = createMutation.isPending || updateMutation.isPending || moveMutation.isPending;

  function set<K extends keyof ClientFormValues>(field: K, value: ClientFormValues[K]) {
    setForm((f) => (f ? { ...f, [field]: value } : f));
  }

  async function handleSave() {
    if (!form || !canSave) return;
    setError(null);
    try {
      if (!clientId) {
        await createMutation.mutateAsync(form);
      } else {
        if (canEditBasics) {
          await updateMutation.mutateAsync({ id: clientId, form });
        }
        if (existing && form.stageId !== existing.stageId) {
          await moveMutation.mutateAsync({ id: clientId, stageId: form.stageId });
        }
      }
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo guardar el cliente. Intenta de nuevo.'));
    }
  }

  async function handleAddComment() {
    const text = commentDraft.trim();
    if (!text || !clientId) return;
    await addCommentMutation.mutateAsync({ userId: user!.id, text });
    setCommentDraft('');
  }

  return (
    <Modal onClose={onClose} width={520}>
      <div className="modal-header">
        <div className="modal-title">{isEdit ? (canEditBasics ? 'Editar cliente' : 'Información del cliente') : 'Nuevo cliente'}</div>
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
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label" htmlFor="client-nombre">
                    Nombre <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="client-nombre"
                    className="form-input"
                    value={form.nombre}
                    onChange={(e) => set('nombre', e.target.value)}
                    readOnly={!canEditBasics}
                    maxLength={25}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="client-apellidos">
                    Apellidos
                  </label>
                  <input
                    id="client-apellidos"
                    className="form-input"
                    value={form.apellidos}
                    onChange={(e) => set('apellidos', e.target.value)}
                    readOnly={!canEditBasics}
                    maxLength={25}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="client-email">
                  Correo <span className="required-asterisk">*</span>
                </label>
                <input
                  id="client-email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  readOnly={!canEditBasics}
                  maxLength={50}
                />
                {form.email.trim().length > 0 && !isValidEmail(form.email) && (
                  <div className="modal-error-text">Ingresa un correo electrónico válido.</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label" htmlFor="client-telefono">
                    Número de contacto
                  </label>
                  <input
                    id="client-telefono"
                    className="form-input"
                    value={form.telefono}
                    onChange={(e) => set('telefono', e.target.value)}
                    readOnly={!canEditBasics}
                    maxLength={20}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="client-whatsapp">
                    WhatsApp <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="client-whatsapp"
                    className="form-input"
                    value={form.whatsapp}
                    onChange={(e) => set('whatsapp', e.target.value)}
                    readOnly={!canEditBasics}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label" htmlFor="client-source">
                    Origen del cliente
                  </label>
                  <select
                    id="client-source"
                    className="form-select"
                    value={form.sourceId}
                    onChange={(e) => set('sourceId', Number(e.target.value))}
                    disabled={!canEditBasics}
                  >
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="client-stage">
                    Etapa
                  </label>
                  <select
                    id="client-stage"
                    className="form-select"
                    value={form.stageId}
                    onChange={(e) => set('stageId', Number(e.target.value))}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {showOwner && (
                <div className="form-field">
                  <label className="form-label" htmlFor="client-owner">
                    {ownerLabel}
                  </label>
                  <select
                    id="client-owner"
                    className="form-select"
                    value={form.ownerId}
                    onChange={(e) => set('ownerId', e.target.value)}
                  >
                    {ownerOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isEdit && existing && (
                <>
                  <div className="client-modal-created">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 7 12 12 15.5 14" />
                    </svg>
                    <div>
                      <div className="client-modal-created-label">Fecha y hora de ingreso</div>
                      <div className="client-modal-created-value">{fmtDateTime(existing.createdAt)}</div>
                    </div>
                  </div>

                  <div className="client-modal-comments">
                    <label className="form-label">Comentarios</label>
                    <div className="client-comment-list">
                      {(commentsQuery.data ?? []).map((cm) => {
                        const author = users.find((u) => u.id === cm.userId);
                        return (
                          <div className="client-comment" key={cm.id}>
                            <Avatar name={author?.name ?? '?'} color={author?.color ?? '#94A3B8'} size={28} fontSize={11} />
                            <div className="client-comment-bubble">
                              <div className="client-comment-meta">
                                <span className="client-comment-author">{author?.name ?? 'Usuario'}</span>
                                <span className="client-comment-when">{fmtDateShort(cm.createdAt)}</span>
                              </div>
                              <div className="client-comment-text">{cm.text}</div>
                            </div>
                          </div>
                        );
                      })}
                      {commentsQuery.isSuccess && commentsQuery.data.length === 0 && (
                        <div className="client-comment-empty">Todavía no hay comentarios.</div>
                      )}
                    </div>
                    <div className="client-comment-composer">
                      <textarea
                        className="form-textarea"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder="Escribe un comentario..."
                        rows={2}
                      />
                      <button
                        className="btn btn-primary client-comment-submit"
                        onClick={handleAddComment}
                        disabled={!commentDraft.trim() || addCommentMutation.isPending}
                      >
                        Comentar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSave || isSaving}>
          {isSaving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar cliente'}
        </button>
      </div>
    </Modal>
  );
}
