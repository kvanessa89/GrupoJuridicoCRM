using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Clients.Queries.GetStageHistory;

// Segmentos ya cerrados (con ExitedAt) de tiempo por etapa, con el mismo alcance por rol que
// GetClientsQuery. El segmento "abierto" actual de cada cliente no vive acá: se deriva en el
// cliente a partir de ClientDto.StageId + StageEnteredAt, igual que hace el dashboard.
public record GetStageHistoryQuery : IRequest<List<StageHistoryEntryDto>>;

public record StageHistoryEntryDto
{
    public int ClientId { get; init; }
    public int StageId { get; init; }
    public Guid OwnerId { get; init; }
    public DateTime EnteredAt { get; init; }
    public DateTime ExitedAt { get; init; }
}

public class GetStageHistoryQueryHandler : IRequestHandler<GetStageHistoryQuery, List<StageHistoryEntryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetStageHistoryQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<StageHistoryEntryDto>> Handle(GetStageHistoryQuery request, CancellationToken cancellationToken)
    {
        var scopedClientIds = (await ClientScope.ApplyAsync(_context.Clients.AsNoTracking(), _context, _currentUser, cancellationToken))
            .Select(c => c.Id);

        return await _context.StageHistoryEntries
            .AsNoTracking()
            .Where(h => h.ExitedAt != null && scopedClientIds.Contains(h.ClientId))
            .Select(h => new StageHistoryEntryDto
            {
                ClientId = h.ClientId,
                StageId = h.StageId,
                OwnerId = h.OwnerId,
                EnteredAt = h.EnteredAt,
                ExitedAt = h.ExitedAt!.Value,
            })
            .ToListAsync(cancellationToken);
    }
}
