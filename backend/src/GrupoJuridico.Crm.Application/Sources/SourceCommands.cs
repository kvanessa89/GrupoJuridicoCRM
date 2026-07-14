using GrupoJuridico.Crm.Application.Common.Interfaces;
using GrupoJuridico.Crm.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Sources;

public record CreateSourceCommand(string Code, string Label, string Color) : IRequest<int>;

public class CreateSourceCommandHandler : IRequestHandler<CreateSourceCommand, int>
{
    private readonly IApplicationDbContext _context;
    public CreateSourceCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<int> Handle(CreateSourceCommand request, CancellationToken cancellationToken)
    {
        var maxOrder = await _context.Sources.AnyAsync(cancellationToken)
            ? await _context.Sources.MaxAsync(s => s.Order, cancellationToken)
            : -1;

        var source = new Source { Code = request.Code, Label = request.Label, Color = request.Color, Order = maxOrder + 1 };
        _context.Sources.Add(source);
        await _context.SaveChangesAsync(cancellationToken);
        return source.Id;
    }
}

public record UpdateSourceCommand(int Id, string Label, string Color) : IRequest;

public class UpdateSourceCommandHandler : IRequestHandler<UpdateSourceCommand>
{
    private readonly IApplicationDbContext _context;
    public UpdateSourceCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(UpdateSourceCommand request, CancellationToken cancellationToken)
    {
        var source = await _context.Sources.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Fuente {request.Id} no encontrada.");
        source.Label = request.Label;
        source.Color = request.Color;
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public record ReorderSourceCommand(int Id, int Direction) : IRequest;

public class ReorderSourceCommandHandler : IRequestHandler<ReorderSourceCommand>
{
    private readonly IApplicationDbContext _context;
    public ReorderSourceCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(ReorderSourceCommand request, CancellationToken cancellationToken)
    {
        var sources = await _context.Sources.OrderBy(s => s.Order).ToListAsync(cancellationToken);
        var i = sources.FindIndex(s => s.Id == request.Id);
        var j = i + request.Direction;
        if (i < 0 || j < 0 || j >= sources.Count) return;

        (sources[i].Order, sources[j].Order) = (sources[j].Order, sources[i].Order);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public record DeleteSourceCommand(int Id) : IRequest;

public class DeleteSourceCommandHandler : IRequestHandler<DeleteSourceCommand>
{
    private readonly IApplicationDbContext _context;
    public DeleteSourceCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(DeleteSourceCommand request, CancellationToken cancellationToken)
    {
        if (await _context.Sources.CountAsync(cancellationToken) <= 1) return;
        var source = await _context.Sources.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (source is null) return;

        var inUse = await _context.Clients.AnyAsync(c => c.SourceId == source.Id, cancellationToken);
        if (inUse)
            throw new InvalidOperationException("No se puede eliminar un origen que tiene clientes asignados.");

        _context.Sources.Remove(source);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
