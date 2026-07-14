using GrupoJuridico.Crm.Domain.Common;

namespace GrupoJuridico.Crm.Domain.Entities;

public class Comment : BaseEntity
{
    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
