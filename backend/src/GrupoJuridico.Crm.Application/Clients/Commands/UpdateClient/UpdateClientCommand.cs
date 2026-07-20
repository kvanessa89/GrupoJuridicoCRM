using GrupoJuridico.Crm.Application.Common;
using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Clients.Commands.UpdateClient;

public record UpdateClientCommand : IRequest
{
    public int Id { get; init; }
    public string Nombre { get; init; } = string.Empty;
    public string Apellidos { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Telefono { get; init; }
    public string? Whatsapp { get; init; }
    public int SourceId { get; init; }
    public Guid OwnerId { get; init; }
}

public class UpdateClientCommandHandler : IRequestHandler<UpdateClientCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateClientCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(UpdateClientCommand request, CancellationToken cancellationToken)
    {
        if (!EmailValidator.IsValid(request.Email))
            throw new InvalidOperationException("El correo electrónico no es válido.");

        var entity = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Cliente {request.Id} no encontrado.");

        if (!await ClientScope.CanAccessAsync(entity.OwnerId, _currentUser, _context, cancellationToken))
            throw new UnauthorizedAccessException("No tienes permiso para editar este cliente.");

        if (request.OwnerId != entity.OwnerId &&
            !await ClientScope.CanAccessAsync(request.OwnerId, _currentUser, _context, cancellationToken))
            throw new UnauthorizedAccessException("No puedes asignar el cliente a ese usuario.");

        entity.Nombre = request.Nombre;
        entity.Apellidos = request.Apellidos;
        entity.Email = request.Email;
        entity.Telefono = request.Telefono;
        entity.Whatsapp = request.Whatsapp;
        entity.SourceId = request.SourceId;
        entity.OwnerId = request.OwnerId;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
