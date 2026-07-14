using Microsoft.AspNetCore.Identity;

namespace GrupoJuridico.Crm.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public User() => Id = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string Color { get; set; } = "#2563EB";

    // Un asesor pertenece a un supervisor. Null para admin/supervisor/editor.
    public Guid? SupervisorId { get; set; }
    public User? Supervisor { get; set; }
    public ICollection<User> Advisors { get; set; } = new List<User>();

    public ICollection<Client> OwnedClients { get; set; } = new List<Client>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
