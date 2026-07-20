using GrupoJuridico.Crm.Domain.Common;

namespace GrupoJuridico.Crm.Domain.Entities;

// Foto congelada del tablero en un momento dado (conteo de clientes por etapa), generada
// manualmente por un admin/supervisor — para comparar cómo cerró/va cada mes en el tiempo.
public class BoardSnapshot : BaseEntity
{
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public Guid GeneratedByUserId { get; set; }
    public User GeneratedByUser { get; set; } = null!;

    public ICollection<BoardSnapshotEntry> Entries { get; set; } = new List<BoardSnapshotEntry>();
}

// Denormaliza nombre/color de la etapa: si luego se renombra, recolorea o borra la etapa,
// el reporte histórico no debe cambiar ni romperse.
public class BoardSnapshotEntry : BaseEntity
{
    public int BoardSnapshotId { get; set; }
    public BoardSnapshot BoardSnapshot { get; set; } = null!;

    public int StageId { get; set; }
    public string StageName { get; set; } = string.Empty;
    public string StageColor { get; set; } = string.Empty;
    public int Count { get; set; }
}
