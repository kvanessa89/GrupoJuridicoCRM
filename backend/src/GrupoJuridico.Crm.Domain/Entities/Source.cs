using GrupoJuridico.Crm.Domain.Common;

namespace GrupoJuridico.Crm.Domain.Entities;

// Fuente/etiqueta de origen del cliente (ej: "P1 - Redes sociales").
public class Source : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Color { get; set; } = "#2563EB";
    public int Order { get; set; }

    public ICollection<Client> Clients { get; set; } = new List<Client>();
}
