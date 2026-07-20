using GrupoJuridico.Crm.Application.Clients;
using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Clients.Commands.SetBoardVisibility;

// Oculta o restaura un cliente del tablero sin borrarlo. Ocultar solo se permite si la
// etapa actual del cliente tiene HideableStage = true (ej. "Cerrado ganado"); restaurar
// siempre se permite.
public record SetClientBoardVisibilityCommand : IRequest
{
    public int ClientId { get; init; }
    public bool Hidden { get; init; }
}

public class SetClientBoardVisibilityCommandHandler : IRequestHandler<SetClientBoardVisibilityCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public SetClientBoardVisibilityCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(SetClientBoardVisibilityCommand request, CancellationToken cancellationToken)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.Id == request.ClientId, cancellationToken)
            ?? throw new KeyNotFoundException($"Cliente {request.ClientId} no encontrado.");

        // Admin sin restricción; supervisor solo con sus propios clientes o los de sus asesores.
        if (!await ClientScope.CanAccessAsync(client.OwnerId, _currentUser, _context, cancellationToken))
            throw new UnauthorizedAccessException("No tienes permiso para ocultar/restaurar este cliente del tablero.");

        if (request.Hidden)
        {
            var isHideable = await _context.Stages
                .AnyAsync(s => s.Id == client.StageId && s.HideableStage, cancellationToken);
            if (!isHideable)
                throw new InvalidOperationException("Este cliente no está en una etapa que permita ocultarlo del tablero.");
        }

        client.HiddenFromBoard = request.Hidden;
        client.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
