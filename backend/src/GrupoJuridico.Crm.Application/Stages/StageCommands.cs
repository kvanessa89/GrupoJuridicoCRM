using GrupoJuridico.Crm.Application.Common.Interfaces;
using GrupoJuridico.Crm.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Stages;

public record CreateStageCommand(string Name, string Color) : IRequest<int>;

public class CreateStageCommandHandler : IRequestHandler<CreateStageCommand, int>
{
    private readonly IApplicationDbContext _context;
    public CreateStageCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<int> Handle(CreateStageCommand request, CancellationToken cancellationToken)
    {
        var maxOrder = await _context.Stages.AnyAsync(cancellationToken)
            ? await _context.Stages.MaxAsync(s => s.Order, cancellationToken)
            : -1;

        var stage = new Stage { Name = request.Name, Color = request.Color, Order = maxOrder + 1 };
        _context.Stages.Add(stage);
        await _context.SaveChangesAsync(cancellationToken);
        return stage.Id;
    }
}

public record UpdateStageCommand(int Id, string Name, string Color) : IRequest;

public class UpdateStageCommandHandler : IRequestHandler<UpdateStageCommand>
{
    private readonly IApplicationDbContext _context;
    public UpdateStageCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(UpdateStageCommand request, CancellationToken cancellationToken)
    {
        var stage = await _context.Stages.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Etapa {request.Id} no encontrada.");
        stage.Name = request.Name;
        stage.Color = request.Color;
        await _context.SaveChangesAsync(cancellationToken);
    }
}

// Mueve una etapa una posición hacia adelante (+1) o atrás (-1) — como moveColumn() en el diseño original.
public record ReorderStageCommand(int Id, int Direction) : IRequest;

public class ReorderStageCommandHandler : IRequestHandler<ReorderStageCommand>
{
    private readonly IApplicationDbContext _context;
    public ReorderStageCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(ReorderStageCommand request, CancellationToken cancellationToken)
    {
        var stages = await _context.Stages.OrderBy(s => s.Order).ToListAsync(cancellationToken);
        var i = stages.FindIndex(s => s.Id == request.Id);
        var j = i + request.Direction;
        if (i < 0 || j < 0 || j >= stages.Count) return;

        (stages[i].Order, stages[j].Order) = (stages[j].Order, stages[i].Order);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

// Marca (o desmarca) una etapa como "ocultable": si un cliente llega ahí, supervisor/admin
// pueden ocultarlo del tablero (ver SetClientBoardVisibilityCommand).
public record SetStageHideableCommand(int StageId, bool Hideable) : IRequest;

public class SetStageHideableCommandHandler : IRequestHandler<SetStageHideableCommand>
{
    private readonly IApplicationDbContext _context;
    public SetStageHideableCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(SetStageHideableCommand request, CancellationToken cancellationToken)
    {
        var stage = await _context.Stages.FirstOrDefaultAsync(s => s.Id == request.StageId, cancellationToken)
            ?? throw new KeyNotFoundException($"Etapa {request.StageId} no encontrada.");

        stage.HideableStage = request.Hideable;
        await _context.SaveChangesAsync(cancellationToken);
    }
}

// No permite borrar la última etapa; reasigna los clientes a la etapa más cercana, igual que deleteColumn() original.
public record DeleteStageCommand(int Id) : IRequest;

public class DeleteStageCommandHandler : IRequestHandler<DeleteStageCommand>
{
    private readonly IApplicationDbContext _context;
    public DeleteStageCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(DeleteStageCommand request, CancellationToken cancellationToken)
    {
        if (await _context.Stages.CountAsync(cancellationToken) <= 1) return;

        var stage = await _context.Stages.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (stage is null) return;

        var fallback = await _context.Stages
            .Where(s => s.Id != stage.Id)
            .OrderBy(s => Math.Abs(s.Order - stage.Order))
            .FirstOrDefaultAsync(cancellationToken);

        if (fallback is not null)
        {
            var affected = await _context.Clients.Where(c => c.StageId == stage.Id).ToListAsync(cancellationToken);
            foreach (var c in affected) c.StageId = fallback.Id;
        }

        _context.Stages.Remove(stage);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
