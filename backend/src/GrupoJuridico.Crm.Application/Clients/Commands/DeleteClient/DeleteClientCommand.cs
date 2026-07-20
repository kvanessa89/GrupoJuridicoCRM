using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Clients.Commands.DeleteClient;

public record DeleteClientCommand(int Id) : IRequest;

public class DeleteClientCommandHandler : IRequestHandler<DeleteClientCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeleteClientCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(DeleteClientCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (entity is null) return;

        if (!await ClientScope.CanAccessAsync(entity.OwnerId, _currentUser, _context, cancellationToken))
            throw new UnauthorizedAccessException("No tienes permiso para eliminar este cliente.");

        _context.Clients.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
