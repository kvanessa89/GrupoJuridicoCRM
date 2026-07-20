using GrupoJuridico.Crm.Application.Common.Interfaces;
using GrupoJuridico.Crm.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Clients.Commands.AddComment;

public record AddCommentCommand : IRequest<int>
{
    public int ClientId { get; init; }
    public Guid UserId { get; init; }
    public string Text { get; init; } = string.Empty;
}

public class AddCommentCommandHandler : IRequestHandler<AddCommentCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AddCommentCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<int> Handle(AddCommentCommand request, CancellationToken cancellationToken)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId, cancellationToken)
            ?? throw new KeyNotFoundException($"Cliente {request.ClientId} no encontrado.");

        if (!await ClientScope.CanAccessAsync(client.OwnerId, _currentUser, _context, cancellationToken))
            throw new UnauthorizedAccessException("No tienes permiso para comentar en este cliente.");

        var comment = new Comment
        {
            ClientId = request.ClientId,
            UserId = request.UserId,
            Text = request.Text,
            CreatedAt = DateTime.UtcNow,
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync(cancellationToken);
        return comment.Id;
    }
}
