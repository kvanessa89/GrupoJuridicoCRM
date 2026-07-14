import './BarRow.css';

interface BarRowProps {
  name: string;
  valueLabel: string;
  percent: number;
  color: string;
  dotColor?: string;
}

export function BarRow({ name, valueLabel, percent, color, dotColor }: BarRowProps) {
  return (
    <div className="bar-row">
      <div className="bar-row-head">
        <span className="bar-row-name">
          {dotColor && <span className="bar-row-dot" style={{ background: dotColor }} />}
          {name}
        </span>
        <span className="bar-row-value">{valueLabel}</span>
      </div>
      <div className="bar-row-track">
        <div className="bar-row-fill" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}
