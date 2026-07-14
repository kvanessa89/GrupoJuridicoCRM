namespace GrupoJuridico.Crm.Application.Clients.Dtos;

public class ClientDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Whatsapp { get; set; }
    public int SourceId { get; set; }
    public int StageId { get; set; }
    public Guid OwnerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime StageEnteredAt { get; set; }
}

public class ClientCommentDto
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
