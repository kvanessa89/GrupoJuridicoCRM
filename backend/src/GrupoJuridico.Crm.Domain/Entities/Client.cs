using GrupoJuridico.Crm.Domain.Common;

namespace GrupoJuridico.Crm.Domain.Entities;

public class Client : BaseAuditableEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Whatsapp { get; set; }

    public int SourceId { get; set; }
    public Source Source { get; set; } = null!;

    public int StageId { get; set; }
    public Stage Stage { get; set; } = null!;
    public DateTime StageEnteredAt { get; set; } = DateTime.UtcNow;

    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    // Ocultar del tablero (no borra el cliente): lo pone un supervisor/admin cuando
    // el cliente llega a una etapa listada en HideableStages, ej. "Cerrado ganado".
    public bool HiddenFromBoard { get; set; }

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<StageHistoryEntry> StageHistory { get; set; } = new List<StageHistoryEntry>();
}
