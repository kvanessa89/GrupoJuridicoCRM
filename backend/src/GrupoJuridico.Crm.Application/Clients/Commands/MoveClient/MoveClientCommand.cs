using GrupoJuridico.Crm.Application.Common.Interfaces;
using GrupoJuridico.Crm.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Clients.Commands.MoveClient;

// Mueve un cliente a otra etapa del pipeline. Cierra el segmento de historial
// actual (ExitedAt) y abre uno nuevo — equivalente a _applyStage() en el diseño original.
public record MoveClientCommand : IRequest
{
    public int ClientId { get; init; }
    public int NewStageId { get; init; }
}

public class MoveClientCommandHandler : IRequestHandler<MoveClientCommand>
{
    private readonly IApplicationDbContext _context;

    public MoveClientCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(MoveClientCommand request, CancellationToken cancellationToken)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.Id == request.ClientId, cancellationToken)
            ?? throw new KeyNotFoundException($"Cliente {request.ClientId} no encontrado.");

        if (client.StageId == request.NewStageId) return;

        var now = DateTime.UtcNow;

        _context.StageHistoryEntries.Add(new StageHistoryEntry
        {
            ClientId = client.Id,
            StageId = client.StageId,
            OwnerId = client.OwnerId,
            EnteredAt = client.StageEnteredAt,
            ExitedAt = now,
        });

        client.StageId = request.NewStageId;
        client.StageEnteredAt = now;
        client.UpdatedAt = now;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
