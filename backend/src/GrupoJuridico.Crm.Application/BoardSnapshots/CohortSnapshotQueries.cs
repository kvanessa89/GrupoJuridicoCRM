using GrupoJuridico.Crm.Application.Clients;
using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.BoardSnapshots;

// Meses (con clientes visibles para el usuario actual) que puede elegir el selector
// del reporte de cohorte, más recientes primero.
public record GetClientEntryMonthsQuery : IRequest<List<string>>;

public class GetClientEntryMonthsQueryHandler : IRequestHandler<GetClientEntryMonthsQuery, List<string>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetClientEntryMonthsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<string>> Handle(GetClientEntryMonthsQuery request, CancellationToken cancellationToken)
    {
        var createdDates = await (await ClientScope.ApplyAsync(_context.Clients.AsNoTracking(), _context, _currentUser, cancellationToken))
            .Select(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return createdDates
            .Select(d => new DateTime(d.Year, d.Month, 1))
            .Distinct()
            .OrderByDescending(d => d)
            .Select(d => d.ToString("yyyy-MM"))
            .ToList();
    }
}

// Para los clientes que ingresaron en un mes dado (la cohorte), reconstruye en qué etapa
// estaba cada uno al cierre de cada mes calendario desde su ingreso hasta el mes actual
// (usando StageHistoryEntries + la etapa actual del cliente como segmento abierto).
// Totalmente independiente de BoardSnapshot: el eje de tiempo son meses de calendario,
// no fechas de reportes generados. Arma la misma forma que GetBoardSnapshotsQuery para
// poder reutilizar BoardSnapshotChart en el frontend (cada "snapshot" aquí es un mes).
public record GetCohortBoardSnapshotsQuery : IRequest<List<BoardSnapshotDto>>
{
    public string Month { get; init; } = string.Empty;
}

public class GetCohortBoardSnapshotsQueryHandler : IRequestHandler<GetCohortBoardSnapshotsQuery, List<BoardSnapshotDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetCohortBoardSnapshotsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<BoardSnapshotDto>> Handle(GetCohortBoardSnapshotsQuery request, CancellationToken cancellationToken)
    {
        if (!DateTime.TryParseExact(
                $"{request.Month}-01",
                "yyyy-MM-dd",
                null,
                System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal,
                out var monthStart))
            return new List<BoardSnapshotDto>();
        var monthEnd = monthStart.AddMonths(1);

        var cohortClients = await (await ClientScope.ApplyAsync(
                _context.Clients.AsNoTracking().Where(c => c.CreatedAt >= monthStart && c.CreatedAt < monthEnd),
                _context, _currentUser, cancellationToken))
            .Select(c => new { c.Id, c.StageId, c.StageEnteredAt })
            .ToListAsync(cancellationToken);

        if (cohortClients.Count == 0) return new List<BoardSnapshotDto>();

        var stages = await _context.Stages.AsNoTracking().OrderBy(s => s.Order).ToListAsync(cancellationToken);

        var cohortIds = cohortClients.Select(c => c.Id).ToList();

        var closedSegments = await _context.StageHistoryEntries
            .AsNoTracking()
            .Where(h => cohortIds.Contains(h.ClientId) && h.ExitedAt != null)
            .Select(h => new { h.ClientId, h.StageId, h.EnteredAt, h.ExitedAt })
            .ToListAsync(cancellationToken);

        // Línea de tiempo por cliente: segmentos cerrados + el segmento abierto actual (ExitedAt = null).
        var timelineByClient = cohortClients.ToDictionary(
            c => c.Id,
            c => closedSegments
                .Where(s => s.ClientId == c.Id)
                .Select(s => (StageId: s.StageId, EnteredAt: s.EnteredAt, ExitedAt: s.ExitedAt))
                .Append((StageId: c.StageId, EnteredAt: c.StageEnteredAt, ExitedAt: (DateTime?)null))
                .OrderBy(s => s.EnteredAt)
                .ToList());

        int? StageAsOf(int clientId, DateTime asOf)
        {
            foreach (var seg in timelineByClient[clientId])
            {
                if (seg.EnteredAt <= asOf && (seg.ExitedAt == null || asOf < seg.ExitedAt.Value)) return seg.StageId;
            }
            return null;
        }

        // Un punto por cada mes calendario, desde el ingreso de la cohorte hasta el mes actual,
        // pero solo para los meses en los que algún cliente de la cohorte entró a una etapa
        // (segmento cerrado o el abierto actual) — si un mes no tuvo ningún movimiento, se omite.
        var movementDates = timelineByClient.Values.SelectMany(t => t.Select(seg => seg.EnteredAt)).ToList();

        var now = DateTime.UtcNow;
        var points = new List<DateTime>();
        var cursor = monthStart;
        while (cursor <= now)
        {
            var nextMonth = cursor.AddMonths(1);
            if (movementDates.Any(d => d >= cursor && d < nextMonth))
            {
                points.Add(nextMonth <= now ? nextMonth.AddTicks(-1) : now);
            }
            cursor = nextMonth;
        }

        var result = new List<BoardSnapshotDto>();
        var pointId = 1;
        foreach (var asOf in points)
        {
            var counts = new Dictionary<int, int>();
            foreach (var client in cohortClients)
            {
                var stageId = StageAsOf(client.Id, asOf);
                if (stageId == null) continue;
                counts[stageId.Value] = counts.GetValueOrDefault(stageId.Value) + 1;
            }

            result.Add(new BoardSnapshotDto
            {
                Id = pointId++,
                GeneratedAt = asOf,
                GeneratedByName = string.Empty,
                Entries = stages.Select(st => new BoardSnapshotEntryDto
                {
                    StageId = st.Id,
                    StageName = st.Name,
                    StageColor = st.Color,
                    Count = counts.GetValueOrDefault(st.Id),
                }).ToList(),
            });
        }

        return result;
    }
}
