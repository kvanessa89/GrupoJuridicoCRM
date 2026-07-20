import { useLayoutEffect, useMemo, useState } from 'react';
import type { BoardSnapshot } from './boardSnapshotTypes';
import type { Stage } from '../stages/types';
import './BoardSnapshotChart.css';

interface BoardSnapshotChartProps {
  snapshots: BoardSnapshot[];
  stages: Stage[];
  showTable: boolean;
}

interface HoverState {
  snapshotIdx: number;
  stageId: number;
  x: number;
  y: number;
}

const BAR_WIDTH = 24;
const SEGMENT_GAP = 2;
const CHART_HEIGHT = 220;
const AXIS_PAD_LEFT = 36;
const AXIS_PAD_BOTTOM = 26;
const AXIS_PAD_TOP = 10;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function fmtTimeShort(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtTimeFull(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtDateTime(iso: string) {
  return `${fmtDate(iso)}, ${fmtTimeFull(iso)}`;
}

// Ancho mínimo de banda para poder mostrar la hora junto a la fecha en el eje sin
// que se encime con las etiquetas vecinas; por debajo de esto solo cabe la fecha.
const MIN_BAND_WIDTH_FOR_TIME = 78;

function niceMax(n: number): number {
  if (n <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const residual = n / magnitude;
  let niceResidual;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;
  return niceResidual * magnitude;
}

export function BoardSnapshotChart({ snapshots, stages, showTable }: BoardSnapshotChartProps) {
  const [plotEl, setPlotEl] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<HoverState | null>(null);

  // El div del plot se desmonta/remonta cada vez que se alterna con la tabla (rama
  // condicional más abajo), así que el observer debe reengancharse a ese nodo, no
  // configurarse una sola vez — si no, tras el primer cambio queda observando un
  // nodo ya desmontado y el ancho se congela en el último valor medido.
  useLayoutEffect(() => {
    if (!plotEl) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(plotEl);
    return () => ro.disconnect();
  }, [plotEl]);

  // Orden fijo de etapas: el orden actual del tablero, más cualquier etapa que ya no
  // exista pero aparezca en reportes viejos (se agrega al final, nunca se reordena).
  const stageOrder = useMemo(() => {
    const seen = new Set<number>();
    const ordered: { id: number; name: string; color: string }[] = [];
    for (const s of stages) {
      ordered.push({ id: s.id, name: s.name, color: s.color });
      seen.add(s.id);
    }
    for (const snap of snapshots) {
      for (const e of snap.entries) {
        if (!seen.has(e.stageId)) {
          ordered.push({ id: e.stageId, name: e.stageName, color: e.stageColor });
          seen.add(e.stageId);
        }
      }
    }
    return ordered;
  }, [stages, snapshots]);

  const maxTotal = useMemo(() => {
    const totals = snapshots.map((s) => s.entries.reduce((sum, e) => sum + e.count, 0));
    return niceMax(Math.max(0, ...totals));
  }, [snapshots]);

  if (snapshots.length === 0) {
    return <div className="snapshot-chart-empty">Todavía no hay reportes generados.</div>;
  }

  const plotWidth = Math.max(0, width - AXIS_PAD_LEFT);
  const bandWidth = plotWidth / snapshots.length;
  const plotHeight = CHART_HEIGHT - AXIS_PAD_TOP - AXIS_PAD_BOTTOM;
  const yTicks = [0, maxTotal / 2, maxTotal];

  const hoveredSnap = hover ? snapshots[hover.snapshotIdx] : null;
  const hoveredStage = hover ? stageOrder.find((s) => s.id === hover.stageId) : null;
  const hoveredEntry = hover ? hoveredSnap?.entries.find((e) => e.stageId === hover.stageId) : null;

  return (
    <div className="snapshot-chart">
      <div className="snapshot-chart-toolbar">
        <div className="snapshot-chart-legend">
          {stageOrder.map((s) => (
            <span key={s.id} className="snapshot-chart-legend-item">
              <span className="snapshot-chart-legend-swatch" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      {showTable ? (
        <div className="snapshot-chart-table-wrap">
          <table className="snapshot-chart-table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                {stageOrder.map((s) => (
                  <th key={s.id}>{s.name}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap) => {
                const byStage = new Map(snap.entries.map((e) => [e.stageId, e.count]));
                const total = snap.entries.reduce((sum, e) => sum + e.count, 0);
                return (
                  <tr key={snap.id}>
                    <td>{fmtDateTime(snap.generatedAt)}</td>
                    {stageOrder.map((s) => (
                      <td key={s.id}>{byStage.get(s.id) ?? 0}</td>
                    ))}
                    <td className="snapshot-chart-table-total">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="snapshot-chart-plot" ref={setPlotEl}>
          <svg width={width} height={CHART_HEIGHT} role="img" aria-label="Clientes por etapa en cada reporte generado">
            {yTicks.map((raw, i) => {
              const y = AXIS_PAD_TOP + plotHeight - (raw / maxTotal) * plotHeight;
              return (
                <g key={i}>
                  <line x1={AXIS_PAD_LEFT} x2={width} y1={y} y2={y} className="snapshot-chart-gridline" />
                  <text x={AXIS_PAD_LEFT - 8} y={y} className="snapshot-chart-tick" textAnchor="end" dominantBaseline="middle">
                    {Math.round(raw)}
                  </text>
                </g>
              );
            })}

            {snapshots.map((snap, i) => {
              const byStage = new Map(snap.entries.map((e) => [e.stageId, e.count]));
              const bandX = AXIS_PAD_LEFT + i * bandWidth;
              const barX = bandX + (bandWidth - BAR_WIDTH) / 2;
              const baseline = AXIS_PAD_TOP + plotHeight;
              let cursorY = baseline;

              return (
                <g key={snap.id}>
                  {stageOrder.map((s) => {
                    const count = byStage.get(s.id) ?? 0;
                    if (count <= 0) return null;
                    const segHeight = Math.max(0, (count / maxTotal) * plotHeight - SEGMENT_GAP);
                    const y = cursorY - segHeight;
                    const isHovered = hover?.snapshotIdx === i && hover.stageId === s.id;
                    cursorY = y - SEGMENT_GAP;
                    return (
                      <rect
                        key={s.id}
                        x={barX}
                        y={y}
                        width={BAR_WIDTH}
                        height={segHeight}
                        fill={s.color}
                        opacity={isHovered ? 0.78 : 1}
                        tabIndex={0}
                        onPointerMove={(e) => {
                          const rect = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                          setHover({ snapshotIdx: i, stageId: s.id, x: e.clientX - rect.left, y: e.clientY - rect.top });
                        }}
                        onPointerLeave={() => setHover(null)}
                        onFocus={() => setHover({ snapshotIdx: i, stageId: s.id, x: barX + BAR_WIDTH / 2, y })}
                        onBlur={() => setHover(null)}
                      />
                    );
                  })}
                  <text x={barX + BAR_WIDTH / 2} y={baseline + 18} textAnchor="middle" className="snapshot-chart-axis-label">
                    {bandWidth >= MIN_BAND_WIDTH_FOR_TIME
                      ? `${fmtDate(snap.generatedAt)} ${fmtTimeShort(snap.generatedAt)}`
                      : fmtDate(snap.generatedAt)}
                  </text>
                </g>
              );
            })}
          </svg>

          {hover && hoveredStage && (
            <div className="snapshot-chart-tooltip" style={{ left: hover.x, top: hover.y }}>
              <div className="snapshot-chart-tooltip-value">{hoveredEntry?.count ?? 0}</div>
              <div className="snapshot-chart-tooltip-label">
                <span className="snapshot-chart-tooltip-dot" style={{ background: hoveredStage.color }} />
                {hoveredStage.name}
              </div>
              <div className="snapshot-chart-tooltip-date">{hoveredSnap && fmtDateTime(hoveredSnap.generatedAt)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
