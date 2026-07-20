import { useState } from 'react';
import './DonutChart.css';

interface DonutDatum {
  id: number;
  name: string;
  color: string;
  count: number;
}

interface DonutChartProps {
  data: DonutDatum[];
  emptyMessage?: string;
}

const SIZE = 120;
const RADIUS = 44;
const STROKE = 18;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ data, emptyMessage = 'Aún no hay datos de origen.' }: DonutChartProps) {
  const [hoverId, setHoverId] = useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return <div className="donut-chart-empty">{emptyMessage}</div>;
  }

  const nonZero = data.filter((d) => d.count > 0);
  const isSingle = nonZero.length === 1;

  let cursor = 0;
  const segments = nonZero.map((d) => {
    const fraction = d.count / total;
    const length = fraction * CIRCUMFERENCE;
    const seg = { ...d, length, offset: cursor, percent: Math.round(fraction * 100) };
    cursor += length;
    return seg;
  });

  const hovered = segments.find((s) => s.id === hoverId);

  return (
    <div className="donut-chart">
      <div className="donut-chart-plot">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Origen del cliente">
          <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            {segments.map((seg) => (
              <circle
                key={seg.id}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
                strokeDashoffset={-seg.offset}
                opacity={hoverId !== null && hoverId !== seg.id ? 0.4 : 1}
                tabIndex={0}
                onPointerEnter={() => setHoverId(seg.id)}
                onPointerLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(seg.id)}
                onBlur={() => setHoverId(null)}
              />
            ))}
          </g>
        </svg>

        <div className="donut-chart-center">
          {isSingle ? (
            <span className="donut-chart-center-value">{segments[0].percent}%</span>
          ) : hovered ? (
            <span className="donut-chart-center-value">{hovered.count}</span>
          ) : null}
        </div>
      </div>

      <div className="donut-chart-legend">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className={`donut-chart-legend-item${hoverId === seg.id ? ' donut-chart-legend-item--hover' : ''}`}
            onPointerEnter={() => setHoverId(seg.id)}
            onPointerLeave={() => setHoverId(null)}
          >
            <span className="donut-chart-legend-dot" style={{ background: seg.color }} />
            <span className="donut-chart-legend-name">{seg.name}</span>
            <span className="donut-chart-legend-value">
              {seg.count} · {seg.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
