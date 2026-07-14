import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { canFilterTeam, isEditor } from '../auth/roles';
import { useClientsQuery, useStageHistoryQuery } from '../clients/useClients';
import { useStagesQuery } from '../stages/stagesApi';
import { useSourcesQuery } from '../sources/sourcesApi';
import { useUsersQuery } from '../users/usersApi';
import { advisorsManagedBy } from '../users/teamHelpers';
import { MetricCard } from '../shared/components/MetricCard';
import { BarRow } from '../shared/components/BarRow';
import { buildSegments, average, fmtHours } from './panelMetrics';
import './PanelPage.css';

export function PanelPage() {
  const { user } = useAuth();
  const clientsQuery = useClientsQuery();
  const stageHistoryQuery = useStageHistoryQuery();
  const stagesQuery = useStagesQuery();
  const sourcesQuery = useSourcesQuery();
  const usersQuery = useUsersQuery();

  const [filterId, setFilterId] = useState<string>('all');

  const clients = clientsQuery.data ?? [];
  const stageHistory = stageHistoryQuery.data ?? [];
  const stages = stagesQuery.data ?? [];
  const sources = sourcesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const canFilter = !!user && canFilterTeam(user.role);
  const showStageTiming = !!user && !isEditor(user.role);

  const managedAdvisors = useMemo(() => (user ? advisorsManagedBy(users, user) : []), [users, user]);

  const dashScope = useMemo(() => {
    if (canFilter && filterId !== 'all') return clients.filter((c) => c.ownerId === filterId);
    return clients;
  }, [clients, canFilter, filterId]);

  const filteredAdvisors = useMemo(
    () => managedAdvisors.filter((a) => filterId === 'all' || a.id === filterId),
    [managedAdvisors, filterId],
  );

  const wonStage = stages[stages.length - 1];

  const total = dashScope.length;
  const won = wonStage ? dashScope.filter((c) => c.stageId === wonStage.id).length : 0;
  const activos = total - won;
  const conv = total ? Math.round((won / total) * 100) : 0;

  const stageCounts = useMemo(
    () => stages.map((stage) => ({ stage, count: dashScope.filter((c) => c.stageId === stage.id).length })),
    [stages, dashScope],
  );
  const maxStageCount = Math.max(1, ...stageCounts.map((s) => s.count));

  const sourceCounts = useMemo(
    () =>
      sources
        .map((src) => ({ src, count: dashScope.filter((c) => c.sourceId === src.id).length }))
        .filter((s) => s.count > 0),
    [sources, dashScope],
  );
  const maxSourceCount = Math.max(1, ...sourceCounts.map((s) => s.count));

  const userCounts = useMemo(
    () => filteredAdvisors.map((a) => ({ advisor: a, count: dashScope.filter((c) => c.ownerId === a.id).length })),
    [filteredAdvisors, dashScope],
  );
  const maxUserCount = Math.max(1, ...userCounts.map((s) => s.count));

  const segments = useMemo(() => buildSegments(dashScope, stageHistory), [dashScope, stageHistory]);

  const stageTimes = useMemo(
    () => stages.map((stage) => ({ stage, avg: average(segments.filter((s) => s.stageId === stage.id)) })),
    [stages, segments],
  );
  const maxStageAvg = Math.max(1, ...stageTimes.map((s) => s.avg));
  const bottleneck = [...stageTimes].sort((a, b) => b.avg - a.avg)[0];
  const bottleneckLabel = bottleneck && bottleneck.avg > 0 ? `${bottleneck.stage.name} · ${fmtHours(bottleneck.avg)}` : '—';

  const advisorTimes = useMemo(
    () =>
      filteredAdvisors
        .map((advisor) => {
          const advisorSegs = segments.filter((s) => s.ownerId === advisor.id);
          const avg = average(advisorSegs);
          let slowestName = '—';
          let slowestAvg = -1;
          for (const stage of stages) {
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
              {a.name.split(' ')[0]}
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
        <MetricCard label="Conversión" value={`${conv}%`} sub="Ganados / total" color="#7c3aed" />
      </div>

      <div className="panel-grid">
        <div className="panel-card">
          <div className="panel-card-title">Clientes por etapa</div>
          <div className="panel-bar-list">
            {stageCounts.map(({ stage, count }) => (
              <BarRow
                key={stage.id}
                name={stage.name}
                valueLabel={String(count)}
                percent={Math.round((count / maxStageCount) * 100)}
                color={stage.color}
              />
            ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card-title">Origen del cliente</div>
          <div className="panel-bar-list">
            {sourceCounts.map(({ src, count }) => (
              <BarRow
                key={src.id}
                name={`${src.code} · ${src.label}`}
                valueLabel={String(count)}
                percent={Math.round((count / maxSourceCount) * 100)}
                color={src.color}
                dotColor={src.color}
              />
            ))}
          </div>
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
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showStageTiming && (
        <div className="panel-card panel-timing">
          <div className="panel-timing-header">
            <div>
              <div className="panel-card-title">Tiempo promedio en cada etapa</div>
              <div className="panel-timing-sub">Cuánto permanecen los clientes en cada etapa del tablero</div>
            </div>
            <div className="panel-bottleneck">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <div>
                <div className="panel-bottleneck-label">Cuello de botella</div>
                <div className="panel-bottleneck-value">{bottleneckLabel}</div>
              </div>
            </div>
          </div>

          <div className="panel-timing-grid">
            <div className="panel-bar-list">
              {stageTimes.map(({ stage, avg }) => (
                <BarRow
                  key={stage.id}
                  name={stage.name}
                  valueLabel={avg > 0 ? fmtHours(avg) : '—'}
                  percent={Math.round((avg / maxStageAvg) * 100)}
                  color={stage.color}
                />
              ))}
            </div>

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
    </div>
  );
}
