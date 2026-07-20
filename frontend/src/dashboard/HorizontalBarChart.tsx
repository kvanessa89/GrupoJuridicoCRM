import { useMemo, useState } from 'react';
import './HorizontalBarChart.css';

interface HorizontalBarDatum {
  id: number;
  name: string;
  color: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: HorizontalBarDatum[];
  formatValue: (hours: number) => string;
  emptyMessage?: string;
}

function niceMax(n: number): number {
  if (n <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const residual = n / magnitude;
  let niceResidual;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;
  return niceResidual * magnitude;
}

function fmtTick(hours: number): string {
  if (hours <= 0) return '0';
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function HorizontalBarChart({ data, formatValue, emptyMessage = 'Sin datos.' }: HorizontalBarChartProps) {
  const [hoverId, setHoverId] = useState<number | null>(null);

  const maxValue = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);
  const xTicks = useMemo(() => [0, maxValue / 2, maxValue], [maxValue]);

  if (data.every((d) => d.value <= 0)) {
    return <div className="hbar-empty">{emptyMessage}</div>;
  }

  return (
    <div className="hbar-chart">
      <div className="hbar-axis-row">
        <span className="hbar-axis-spacer" />
        <span className="hbar-axis-track">
          {xTicks.map((raw, i) => (
            <span key={i} className="hbar-axis-tick" style={{ left: `${(raw / maxValue) * 100}%` }}>
              {fmtTick(raw)}
            </span>
          ))}
        </span>
        <span className="hbar-axis-value-spacer" />
      </div>

      {data.map((d) => {
        const percent = Math.min(100, (d.value / maxValue) * 100);
        const isHovered = hoverId === d.id;
        return (
          <div
            key={d.id}
            className={`hbar-row${isHovered ? ' hbar-row--hover' : ''}`}
            tabIndex={0}
            onPointerEnter={() => setHoverId(d.id)}
            onPointerLeave={() => setHoverId(null)}
            onFocus={() => setHoverId(d.id)}
            onBlur={() => setHoverId(null)}
          >
            <span className="hbar-row-label">{d.name}</span>
            <span className="hbar-row-track">
              {xTicks.map((raw, i) => (
                <span key={i} className="hbar-row-gridline" style={{ left: `${(raw / maxValue) * 100}%` }} />
              ))}
              <span
                className="hbar-row-fill"
                style={{ width: `${percent}%`, background: d.color, opacity: isHovered ? 0.82 : 1 }}
              />
            </span>
            <span className="hbar-row-value">{d.value > 0 ? formatValue(d.value) : '—'}</span>
          </div>
        );
      })}
    </div>
  );
}
