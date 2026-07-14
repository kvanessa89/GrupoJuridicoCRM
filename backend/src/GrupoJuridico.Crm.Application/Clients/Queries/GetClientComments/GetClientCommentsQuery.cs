using GrupoJuridico.Crm.Application.Clients.Dtos;
using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Clients.Queries.GetClientComments;

public record GetClientCommentsQuery(int ClientId) : IRequest<List<ClientCommentDto>>;

public class GetClientCommentsQueryHandler : IRequestHandler<GetClientCommentsQuery, List<ClientCommentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetClientCommentsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<ClientCommentDto>> Handle(GetClientCommentsQuery request, CancellationToken cancellationToken)
    {
        var visible = await ClientScope.ApplyAsync(
            _context.Clients.AsNoTracking().Where(c => c.Id == request.ClientId),
            _context, _currentUser, cancellationToken);

        if (!await visible.AnyAsync(cancellationToken))
            throw new KeyNotFoundException($"Cliente {request.ClientId} no encontrado.");

        return await _context.Comments
            .AsNoTracking()
            .Where(c => c.ClientId == request.ClientId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new ClientCommentDto
            {
                Id = c.Id,
                UserId = c.UserId,
                Text = c.Text,
                CreatedAt = c.CreatedAt,
            })
            .ToListAsync(cancellationToken);
    }
}
