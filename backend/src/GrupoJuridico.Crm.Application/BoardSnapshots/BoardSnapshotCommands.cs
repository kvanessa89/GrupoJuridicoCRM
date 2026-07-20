using GrupoJuridico.Crm.Application.Common.Interfaces;
using GrupoJuridico.Crm.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.BoardSnapshots;

// Cuenta los clientes actuales por etapa y los congela en un nuevo BoardSnapshot —
// disparado a mano por un admin/supervisor desde el botón "Generar reporte" del panel.
public record GenerateBoardSnapshotCommand : IRequest<int>;

public class GenerateBoardSnapshotCommandHandler : IRequestHandler<GenerateBoardSnapshotCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GenerateBoardSnapshotCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<int> Handle(GenerateBoardSnapshotCommand request, CancellationToken cancellationToken)
    {
        var stages = await _context.Stages.AsNoTracking().OrderBy(s => s.Order).ToListAsync(cancellationToken);

        var countsByStage = await _context.Clients
            .AsNoTracking()
            .GroupBy(c => c.StageId)
            .Select(g => new { StageId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.StageId, g => g.Count, cancellationToken);

        var snapshot = new BoardSnapshot
        {
            GeneratedByUserId = _currentUser.UserId!.Value,
            Entries = stages.Select(s => new BoardSnapshotEntry
            {
                StageId = s.Id,
                StageName = s.Name,
                StageColor = s.Color,
                Count = countsByStage.GetValueOrDefault(s.Id),
            }).ToList(),
        };

        _context.BoardSnapshots.Add(snapshot);
        await _context.SaveChangesAsync(cancellationToken);
        return snapshot.Id;
    }
}
