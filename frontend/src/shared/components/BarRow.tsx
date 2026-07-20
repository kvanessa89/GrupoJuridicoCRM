import './BarRow.css';

interface BarRowProps {
  name: string;
  valueLabel: string;
  percent: number;
  color: string;
  dotColor?: string;
  isEmpty?: boolean;
}

export function BarRow({ name, valueLabel, percent, color, dotColor, isEmpty }: BarRowProps) {
  return (
    <div className="bar-row">
      <div className="bar-row-head">
        <span className="bar-row-name">
          {dotColor && <span className="bar-row-dot" style={{ background: dotColor }} />}
          {name}
        </span>
        <span className={`bar-row-value${isEmpty ? ' bar-row-value--empty' : ''}`}>{valueLabel}</span>
      </div>
      <div className={`bar-row-track${isEmpty ? ' bar-row-track--empty' : ''}`}>
        <div className="bar-row-fill" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}
