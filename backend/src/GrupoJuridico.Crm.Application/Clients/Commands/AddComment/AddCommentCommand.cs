using GrupoJuridico.Crm.Application.Common.Interfaces;
using GrupoJuridico.Crm.Domain.Entities;
using MediatR;

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

    public AddCommentCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<int> Handle(AddCommentCommand request, CancellationToken cancellationToken)
    {
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
