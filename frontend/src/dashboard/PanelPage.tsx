import { Fragment, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { canFilterTeam, isEditor } from '../auth/roles';
import { useClientsQuery, useStageHistoryQuery } from '../clients/useClients';
import { useStagesQuery } from '../stages/stagesApi';
import { useSourcesQuery } from '../sources/sourcesApi';
import { useUsersQuery } from '../users/usersApi';
import { peopleWithClients } from '../users/teamHelpers';
import { MetricCard } from '../shared/components/MetricCard';
import { BarRow } from '../shared/components/BarRow';
import { buildSegments, average, fmtHours } from './panelMetrics';
import {
  useBoardSnapshotsQuery,
  useGenerateBoardSnapshotMutation,
  useCohortMonthsQuery,
  useCohortBoardSnapshotsQuery,
} from './boardSnapshotsApi';
import { BoardSnapshotChart } from './BoardSnapshotChart';
import { HorizontalBarChart } from './HorizontalBarChart';
import { DonutChart } from './DonutChart';
import './PanelPage.css';

const DISCARDED_BAR_COLOR = '#94a3b8';

function fmtMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const label = new Date(year, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function PanelPage() {
  const { user } = useAuth();
  const clientsQuery = useClientsQuery();
  const stageHistoryQuery = useStageHistoryQuery();
  const stagesQuery = useStagesQuery();
  const sourcesQuery = useSourcesQuery();
  const usersQuery = useUsersQuery();
  const boardSnapshotsQuery = useBoardSnapshotsQuery();
  const generateSnapshot = useGenerateBoardSnapshotMutation();
  const cohortMonthsQuery = useCohortMonthsQuery();

  const [filterId, setFilterId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showEtapasTable, setShowEtapasTable] = useState(false);
  const [showMesTable, setShowMesTable] = useState(false);

  const cohortMonths = cohortMonthsQuery.data ?? [];
  const activeMonth = selectedMonth ?? cohortMonths[0] ?? null;
  const cohortSnapshotsQuery = useCohortBoardSnapshotsQuery(activeMonth);

  const clients = clientsQuery.data ?? [];
  const stageHistory = stageHistoryQuery.data ?? [];
  const stages = stagesQuery.data ?? [];
  const sources = sourcesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const canFilter = !!user && canFilterTeam(user.role);
  const showStageTiming = !!user && !isEditor(user.role);

  const managedAdvisors = useMemo(() => (user ? peopleWithClients(users, user, clients) : []), [users, user, clients]);

  const dashScope = useMemo(() => {
    if (canFilter && filterId !== 'all') return clients.filter((c) => c.ownerId === filterId);
    return clients;
  }, [clients, canFilter, filterId]);

  const filteredAdvisors = useMemo(
    () => managedAdvisors.filter((a) => filterId === 'all' || a.id === filterId),
    [managedAdvisors, filterId],
  );

  const wonStage = stages.find((s) => s.name.trim().toLowerCase() === 'cerrado ganado') ?? stages[stages.length - 1];
  const discardedStage = stages.find((s) => s.name.trim().toLowerCase() === 'descartados');
  const hideableStageIds = new Set(stages.filter((s) => s.canHideFromBoard).map((s) => s.id));

  const visibleScope = dashScope.filter((c) => !c.hiddenFromBoard);
  const total = visibleScope.length;
  const won = wonStage ? visibleScope.filter((c) => c.stageId === wonStage.id).length : 0;
  const activos = dashScope.filter((c) => !hideableStageIds.has(c.stageId)).length;

  const stageCounts = useMemo(
    () => stages.map((stage) => ({ stage, count: visibleScope.filter((c) => c.stageId === stage.id).length })),
    [stages, visibleScope],
  );
  const maxStageCount = Math.max(1, ...stageCounts.map((s) => s.count));

  const sourceCounts = useMemo(
    () =>
      sources
        .map((src) => ({ src, count: dashScope.filter((c) => c.sourceId === src.id).length }))
        .filter((s) => s.count > 0),
    [sources, dashScope],
  );

  const userCounts = useMemo(
    () =>
      filteredAdvisors
        .map((a) => ({ advisor: a, count: dashScope.filter((c) => c.ownerId === a.id).length }))
        .sort((a, b) => b.count - a.count),
    [filteredAdvisors, dashScope],
  );
  const maxUserCount = Math.max(1, ...userCounts.map((s) => s.count));

  const scopedStageHistory = useMemo(() => {
    if (canFilter && filterId !== 'all') return stageHistory.filter((h) => h.ownerId === filterId);
    return stageHistory;
  }, [stageHistory, canFilter, filterId]);

  const segments = useMemo(() => buildSegments(dashScope, scopedStageHistory), [dashScope, scopedStageHistory]);

  const stageTimes = useMemo(
    () =>
      stages
        .filter((stage) => !stage.canHideFromBoard)
        .map((stage) => ({ stage, avg: average(segments.filter((s) => s.stageId === stage.id)) })),
    [stages, segments],
  );
  const bottleneck = [...stageTimes].sort((a, b) => b.avg - a.avg)[0];

  const advisorTimes = useMemo(
    () =>
      filteredAdvisors
        .map((advisor) => {
          const advisorSegs = segments.filter((s) => s.ownerId === advisor.id);
          const avg = average(advisorSegs);
          let slowestName = '—';
          let slowestAvg = -1;
          for (const stage of stages.filter((s) => !s.canHideFromBoard)) {
            const stageSegs = advisorSegs.filter((s) => s.stageId === stage.id);
            if (stageSegs.length) {
              const stageAvg = average(stageSegs);
              if (stageAvg > slowestAvg) {
                slowestAvg = stageAvg;
                slowestName = stage.name;
              }
            }
          }
          return { advisor, avg, avgLabel: advisorSegs.length ? fmtHours(avg) : '—', slowestName };
        })
        .sort((a, b) => b.avg - a.avg),
    [filteredAdvisors, segments, stages],
  );

  return (
    <div className="panel-page">
      <div className="panel-section-title">Información actual del tablero</div>

      {canFilter && (
        <div className="panel-filter">
          <span className="panel-filter-label">Ver datos de:</span>
          <button
            className={`panel-filter-chip${filterId === 'all' ? ' panel-filter-chip--active' : ''}`}
            onClick={() => setFilterId('all')}
          >
            Todos
          </button>
          {managedAdvisors.map((a) => (
            <button
              key={a.id}
              className={`panel-filter-chip${filterId === a.id ? ' panel-filter-chip--active' : ''}`}
              onClick={() => setFilterId(a.id)}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}

      <div className="panel-metrics">
        <MetricCard
          label="Total clientes"
          value={String(total)}
          sub={user && canFilterTeam(user.role) ? 'Todo el equipo' : 'Asignados a ti'}
          color="var(--color-text)"
        />
        <MetricCard label="En proceso" value={String(activos)} sub="Activos en tablero" color="var(--color-accent)" />
        <MetricCard label="Cerrados ganados" value={String(won)} sub={wonStage?.name ?? ''} color="var(--color-success)" />
        <MetricCard
          label="Etapa de mayor duración"
          value={bottleneck && bottleneck.avg > 0 ? fmtHours(bottleneck.avg) : '—'}
          sub={bottleneck && bottleneck.avg > 0 ? bottleneck.stage.name : 'Sin datos suficientes'}
          color="#7c3aed"
        />
      </div>

      {dashScope.length > 0 && (
        <div className="panel-grid">
          <div className="panel-card">
            <div className="panel-card-title">Clientes por etapa</div>
            <div className="panel-bar-list">
              {stageCounts.map(({ stage, count }) => (
                <Fragment key={stage.id}>
                  {discardedStage?.id === stage.id && <div className="stage-bar-divider" />}
                  <BarRow
                    name={stage.name}
                    valueLabel={String(count)}
                    percent={Math.round((count / maxStageCount) * 100)}
                    color={discardedStage?.id === stage.id ? DISCARDED_BAR_COLOR : stage.color}
                    isEmpty={count === 0}
                  />
                </Fragment>
              ))}
            </div>
          </div>

          <div className="panel-card panel-card--donut">
            <div className="panel-card-title">Origen del cliente</div>
            <DonutChart data={sourceCounts.map(({ src, count }) => ({ id: src.id, name: `${src.code} · ${src.label}`, color: src.color, count }))} />
          </div>

          {canFilter && (
            <div className="panel-card">
              <div className="panel-card-title">Clientes por asesor</div>
              <div className="panel-bar-list">
                {userCounts.map(({ advisor, count }) => (
                  <BarRow
                    key={advisor.id}
                    name={advisor.name}
                    valueLabel={String(count)}
                    percent={Math.round((count / maxUserCount) * 100)}
                    color={advisor.color}
                    dotColor={advisor.color}
                    isEmpty={count === 0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showStageTiming && segments.length > 0 && (
        <div className="panel-card panel-timing">
          <div className="panel-timing-header">
            <div>
              <div className="panel-card-title">Tiempo promedio en cada etapa</div>
              <div className="panel-timing-sub">Cuánto permanecen los clientes en cada etapa del tablero</div>
            </div>
          </div>

          <div className="panel-timing-grid">
            <HorizontalBarChart
              data={stageTimes.map(({ stage, avg }) => ({ id: stage.id, name: stage.name, color: stage.color, value: avg }))}
              formatValue={fmtHours}
            />

            {canFilter && (
              <div>
                <div className="panel-timing-advisor-label">Promedio por asesor</div>
                {advisorTimes.map(({ advisor, avgLabel, slowestName }) => (
                  <div className="panel-advisor-row" key={advisor.id}>
                    <span className="panel-advisor-dot" style={{ background: advisor.color }} />
                    <span className="panel-advisor-name">{advisor.name}</span>
                    <span className="panel-advisor-slow">Más lento: {slowestName}</span>
                    <span className="panel-advisor-avg">{avgLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="panel-section">
        <div className="panel-card">
          <div className="panel-card-title panel-card-title--lg">Reportes del tablero</div>

          <div className="panel-report-section">
            <div className="panel-timing-header">
              <div>
                <div className="panel-report-subtitle">Por etapas</div>
                <div className="panel-report-desc">Cantidad de clientes por etapa, congelada en cada reporte generado manualmente.</div>
              </div>
              <div className="panel-header-actions">
                {canFilter && (
                  <button
                    className="header-add-btn"
                    onClick={() => generateSnapshot.mutate()}
                    disabled={generateSnapshot.isPending}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>{generateSnapshot.isPending ? 'Generando…' : 'Generar reporte'}</span>
                  </button>
                )}
                <button type="button" className="snapshot-chart-toggle" onClick={() => setShowEtapasTable((v) => !v)}>
                  {showEtapasTable ? 'Ver gráfico' : 'Ver tabla'}
                </button>
              </div>
            </div>
            <BoardSnapshotChart snapshots={boardSnapshotsQuery.data ?? []} stages={stages} showTable={showEtapasTable} />
          </div>

          <div className="panel-report-section panel-report-section--divided">
            <div className="panel-timing-header">
              <div>
                <div className="panel-report-subtitle">Por mes</div>
                <div className="panel-report-desc">
                  Clientes que ingresaron en el mes elegido, y en qué etapa estaban cada mes desde su ingreso.
                </div>
              </div>
              <div className="panel-header-actions">
                {cohortMonths.length > 0 && (
                  <select
                    className="panel-month-select"
                    value={activeMonth ?? ''}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {cohortMonths.map((m) => (
                      <option key={m} value={m}>
                        {fmtMonth(m)}
                      </option>
                    ))}
                  </select>
                )}
                {cohortMonths.length > 0 && (
                  <button type="button" className="snapshot-chart-toggle" onClick={() => setShowMesTable((v) => !v)}>
                    {showMesTable ? 'Ver gráfico' : 'Ver tabla'}
                  </button>
                )}
              </div>
            </div>
            {cohortMonths.length === 0 ? (
              <div className="snapshot-chart-empty">Todavía no hay clientes registrados.</div>
            ) : (
              <BoardSnapshotChart snapshots={cohortSnapshotsQuery.data ?? []} stages={stages} showTable={showMesTable} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
