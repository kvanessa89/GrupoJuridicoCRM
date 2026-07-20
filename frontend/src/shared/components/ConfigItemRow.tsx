import { useEffect, useState } from 'react';
import { PALETTE } from '../utils/palette';
import './ConfigItemRow.css';

interface ConfigItemRowProps {
  code?: string;
  value: string;
  placeholder?: string;
  onCommit: (value: string) => void;
  color: string;
  onColorChange: (color: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canDelete: boolean;
  onDelete: () => void;
  deleteTitle: string;
}

export function ConfigItemRow({
  code,
  value,
  placeholder,
  onCommit,
  color,
  onColorChange,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  canDelete,
  onDelete,
  deleteTitle,
}: ConfigItemRowProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed.length > 0 && trimmed !== value) {
      onCommit(trimmed);
    } else {
      setDraft(value);
    }
  }

  return (
    <div className="config-item-row">
      <div className="config-item-arrows">
        <button type="button" className="config-item-arrow" disabled={!canMoveUp} onClick={onMoveUp} aria-label="Mover arriba">
          ▲
        </button>
        <button type="button" className="config-item-arrow" disabled={!canMoveDown} onClick={onMoveDown} aria-label="Mover abajo">
          ▼
        </button>
      </div>

      {code !== undefined && (
        <span className="config-item-code" style={{ background: color }}>
          {code}
        </span>
      )}

      <div className="config-item-swatches">
        {PALETTE.slice(0, 6).map((c) => (
          <button
            key={c}
            type="button"
            className="config-item-swatch"
            style={{ background: c, boxShadow: c === color ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none' }}
            aria-label={c}
            onClick={() => onColorChange(c)}
          />
        ))}
      </div>

      <input
        className="form-input config-item-input"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        maxLength={90}
      />

      <button
        type="button"
        className="config-item-delete"
        disabled={!canDelete}
        title={deleteTitle}
        onClick={onDelete}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16" />
          <path d="M9 7V5h6v2" />
          <path d="M6 7l1 13h10l1-13" />
        </svg>
      </button>
    </div>
  );
}
