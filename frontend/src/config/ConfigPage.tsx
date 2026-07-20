import { ConfigItemRow } from '../shared/components/ConfigItemRow';
import { PALETTE } from '../shared/utils/palette';
import {
  useCreateStageMutation,
  useDeleteStageMutation,
  useReorderStageMutation,
  useSetStageHideableMutation,
  useStagesQuery,
  useUpdateStageMutation,
} from '../stages/stagesApi';
import {
  useCreateSourceMutation,
  useDeleteSourceMutation,
  useReorderSourceMutation,
  useSourcesQuery,
  useUpdateSourceMutation,
} from '../sources/sourcesApi';
import './ConfigPage.css';

function AddIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ConfigPage() {
  const stagesQuery = useStagesQuery();
  const stages = stagesQuery.data ?? [];
  const createStage = useCreateStageMutation();
  const updateStage = useUpdateStageMutation();
  const reorderStage = useReorderStageMutation();
  const deleteStage = useDeleteStageMutation();
  const setStageHideable = useSetStageHideableMutation();

  const sourcesQuery = useSourcesQuery();
  const sources = sourcesQuery.data ?? [];
  const createSource = useCreateSourceMutation();
  const updateSource = useUpdateSourceMutation();
  const reorderSource = useReorderSourceMutation();
  const deleteSource = useDeleteSourceMutation();

  return (
    <div className="config-page">
      <div className="config-card">
        <div className="config-card-header">
          <div className="config-card-title">Etapas del tablero</div>
          <button
            className="header-add-btn"
            onClick={() =>
              createStage.mutate({ name: '', color: PALETTE[stages.length % PALETTE.length] })
            }
          >
            <AddIcon />
            <span>Nueva etapa</span>
          </button>
        </div>
        <p className="config-card-desc">
          Define las columnas que verá todo el equipo en el tablero. Renómbralas, reordénalas o cambia su
          color.
        </p>
        <div className="config-item-list">
          {stages.map((s, i) => (
            <ConfigItemRow
              key={s.id}
              value={s.name}
              placeholder="Nombre de la etapa"
              onCommit={(name) => updateStage.mutate({ id: s.id, name, color: s.color })}
              color={s.color}
              onColorChange={(color) => updateStage.mutate({ id: s.id, name: s.name, color })}
              canMoveUp={i > 0}
              canMoveDown={i < stages.length - 1}
              onMoveUp={() => reorderStage.mutate({ id: s.id, direction: -1 })}
              onMoveDown={() => reorderStage.mutate({ id: s.id, direction: 1 })}
              canDelete={stages.length > 1}
              onDelete={() => deleteStage.mutate(s.id)}
              deleteTitle="Eliminar etapa"
            />
          ))}
        </div>
      </div>

      <div className="config-card">
        <div className="config-card-header">
          <div className="config-card-title">Ocultar clientes del tablero</div>
        </div>
        <p className="config-card-desc">
          Cuando un cliente llega a una de estas etapas, el administrador o el supervisor pueden
          ocultarlo del tablero (sin borrarlo). Marca las etapas que permiten esta acción.
        </p>
        <div className="config-hideable-list">
          {stages.map((s) => (
            <label key={s.id} className="config-hideable-row">
              <span className="config-hideable-name">
                <span className="config-hideable-dot" style={{ background: s.color }} />
                {s.name}
              </span>
              <span
                className={`config-toggle${s.canHideFromBoard ? ' config-toggle--on' : ''}`}
                role="switch"
                aria-checked={s.canHideFromBoard}
                tabIndex={0}
                onClick={() => setStageHideable.mutate({ id: s.id, hideable: !s.canHideFromBoard })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setStageHideable.mutate({ id: s.id, hideable: !s.canHideFromBoard });
                  }
                }}
              >
                <span className="config-toggle-knob" />
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="config-card">
        <div className="config-card-header">
          <div className="config-card-title">Origen del cliente</div>
          <button
            className="header-add-btn"
            onClick={() =>
              createSource.mutate({
                code: `P${sources.length + 1}`,
                label: '',
                color: PALETTE[sources.length % PALETTE.length],
              })
            }
          >
            <AddIcon />
            <span>Nuevo origen</span>
          </button>
        </div>
        <p className="config-card-desc">
          Lista de orígenes disponible al registrar un nuevo cliente. Renómbralos, reordénalos o cambia su
          color.
        </p>
        <div className="config-item-list">
          {sources.map((s, i) => (
            <ConfigItemRow
              key={s.id}
              code={s.code}
              value={s.label}
              placeholder="Nombre del origen"
              onCommit={(label) => updateSource.mutate({ id: s.id, label, color: s.color })}
              color={s.color}
              onColorChange={(color) => updateSource.mutate({ id: s.id, label: s.label, color })}
              canMoveUp={i > 0}
              canMoveDown={i < sources.length - 1}
              onMoveUp={() => reorderSource.mutate({ id: s.id, direction: -1 })}
              onMoveDown={() => reorderSource.mutate({ id: s.id, direction: 1 })}
              canDelete={sources.length > 1}
              onDelete={() => deleteSource.mutate(s.id)}
              deleteTitle="Eliminar origen"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
