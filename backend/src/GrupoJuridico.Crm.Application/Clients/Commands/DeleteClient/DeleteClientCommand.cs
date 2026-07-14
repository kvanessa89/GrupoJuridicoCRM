using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Clients.Commands.DeleteClient;

public record DeleteClientCommand(int Id) : IRequest;

public class DeleteClientCommandHandler : IRequestHandler<DeleteClientCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteClientCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(DeleteClientCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (entity is null) return;

        _context.Clients.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
