using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.BoardSnapshots;

public record GetBoardSnapshotsQuery : IRequest<List<BoardSnapshotDto>>;

public class GetBoardSnapshotsQueryHandler : IRequestHandler<GetBoardSnapshotsQuery, List<BoardSnapshotDto>>
{
    private readonly IApplicationDbContext _context;
    public GetBoardSnapshotsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<BoardSnapshotDto>> Handle(GetBoardSnapshotsQuery request, CancellationToken cancellationToken) =>
        await _context.BoardSnapshots
            .AsNoTracking()
            .OrderBy(s => s.GeneratedAt)
            .Select(s => new BoardSnapshotDto
            {
                Id = s.Id,
                GeneratedAt = s.GeneratedAt,
                GeneratedByName = s.GeneratedByUser.Name,
                Entries = s.Entries
                    .Select(e => new BoardSnapshotEntryDto
                    {
                        StageId = e.StageId,
                        StageName = e.StageName,
                        StageColor = e.StageColor,
                        Count = e.Count,
                    })
                    .ToList(),
            })
            .ToListAsync(cancellationToken);
}
