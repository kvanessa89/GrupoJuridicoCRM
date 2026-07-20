using GrupoJuridico.Crm.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Stages;

public record GetStagesQuery : IRequest<List<StageDto>>;

public class GetStagesQueryHandler : IRequestHandler<GetStagesQuery, List<StageDto>>
{
    private readonly IApplicationDbContext _context;
    public GetStagesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<StageDto>> Handle(GetStagesQuery request, CancellationToken cancellationToken) =>
        await _context.Stages
            .AsNoTracking()
            .OrderBy(s => s.Order)
            .Select(s => new StageDto
            {
                Id = s.Id,
                Name = s.Name,
                Color = s.Color,
                Order = s.Order,
                CanHideFromBoard = s.HideableStage,
            })
            .ToListAsync(cancellationToken);
}
