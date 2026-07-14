using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Sources;

public record GetSourcesQuery : IRequest<List<SourceDto>>;

public class GetSourcesQueryHandler : IRequestHandler<GetSourcesQuery, List<SourceDto>>
{
    private readonly IApplicationDbContext _context;
    public GetSourcesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<SourceDto>> Handle(GetSourcesQuery request, CancellationToken cancellationToken) =>
        await _context.Sources
            .AsNoTracking()
            .OrderBy(s => s.Order)
            .Select(s => new SourceDto { Id = s.Id, Code = s.Code, Label = s.Label, Color = s.Color, Order = s.Order })
            .ToListAsync(cancellationToken);
}
