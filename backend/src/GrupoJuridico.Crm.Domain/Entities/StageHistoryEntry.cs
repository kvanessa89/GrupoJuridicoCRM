using GrupoJuridico.Crm.Domain.Common;

namespace GrupoJuridico.Crm.Domain.Entities;

// Registra cuánto tiempo pasó un cliente en cada etapa — insumo para reportes de velocidad del pipeline.
public class StageHistoryEntry : BaseEntity
{
    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public int StageId { get; set; }
    public Stage Stage { get; set; } = null!;

    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    public DateTime EnteredAt { get; set; }
    public DateTime? ExitedAt { get; set; }
}
