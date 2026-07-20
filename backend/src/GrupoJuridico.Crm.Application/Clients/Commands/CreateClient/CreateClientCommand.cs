using GrupoJuridico.Crm.Application.Common;
using GrupoJuridico.Crm.Application.Common.Interfaces;
using GrupoJuridico.Crm.Domain.Entities;
using MediatR;

namespace GrupoJuridico.Crm.Application.Clients.Commands.CreateClient;

public record CreateClientCommand : IRequest<int>
{
    public string Nombre { get; init; } = string.Empty;
    public string Apellidos { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Telefono { get; init; }
    public string? Whatsapp { get; init; }
    public int SourceId { get; init; }
    public int StageId { get; init; }
    public Guid OwnerId { get; init; }
}

public class CreateClientCommandHandler : IRequestHandler<CreateClientCommand, int>
{
    private readonly IApplicationDbContext _context;

    public CreateClientCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<int> Handle(CreateClientCommand request, CancellationToken cancellationToken)
    {
        if (!EmailValidator.IsValid(request.Email))
            throw new InvalidOperationException("El correo electrónico no es válido.");

        var entity = new Client
        {
            Nombre = request.Nombre,
            Apellidos = request.Apellidos,
            Email = request.Email,
            Telefono = request.Telefono,
            Whatsapp = request.Whatsapp,
            SourceId = request.SourceId,
            StageId = request.StageId,
            OwnerId = request.OwnerId,
            StageEnteredAt = DateTime.UtcNow,
        };

        _context.Clients.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
