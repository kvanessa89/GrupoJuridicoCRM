using GrupoJuridico.Crm.Application.Clients.Dtos;
using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Clients.Queries.GetClients;

public record GetClientsQuery : IRequest<List<ClientDto>>;

public class GetClientsQueryHandler : IRequestHandler<GetClientsQuery, List<ClientDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetClientsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<ClientDto>> Handle(GetClientsQuery request, CancellationToken cancellationToken)
    {
        var query = await ClientScope.ApplyAsync(_context.Clients.AsNoTracking(), _context, _currentUser, cancellationToken);

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ClientDto
            {
                Id = c.Id,
                Nombre = c.Nombre,
                Apellidos = c.Apellidos,
                Email = c.Email,
                Telefono = c.Telefono,
                Whatsapp = c.Whatsapp,
                SourceId = c.SourceId,
                StageId = c.StageId,
                OwnerId = c.OwnerId,
                CreatedAt = c.CreatedAt,
                StageEnteredAt = c.StageEnteredAt,
            })
            .ToListAsync(cancellationToken);
    }
}
