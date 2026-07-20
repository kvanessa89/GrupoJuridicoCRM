using GrupoJuridico.Crm.Domain.Common;

namespace GrupoJuridico.Crm.Domain.Entities;

// Etapa del pipeline / columna del tablero (ej: "Nuevo cliente", "Contactado"...).
public class Stage : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#2563EB";
    public int Order { get; set; }

    // Si un cliente llega a esta etapa, supervisor/admin pueden ocultarlo del tablero
    // (ver SetClientBoardVisibilityCommand) sin borrarlo.
    public bool HideableStage { get; set; }

    public ICollection<Client> Clients { get; set; } = new List<Client>();
}
