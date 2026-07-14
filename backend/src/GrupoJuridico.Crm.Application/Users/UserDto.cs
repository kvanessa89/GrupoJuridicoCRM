namespace GrupoJuridico.Crm.Application.Users;

public class UserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public Guid? SupervisorId { get; set; }
}
