using GrupoJuridico.Crm.Application.Common.Interfaces;
using GrupoJuridico.Crm.Domain.Constants;
using GrupoJuridico.Crm.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Clients;

// Regla de visibilidad de clientes compartida entre queries: un asesor solo ve los suyos,
// un supervisor los de su equipo, admin/editor los ven todos.
public static class ClientScope
{
    public static async Task<IQueryable<Client>> ApplyAsync(
        IQueryable<Client> query,
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Roles.Contains(Roles.Asesor))
        {
            return query.Where(c => c.OwnerId == currentUser.UserId);
        }

        if (currentUser.Roles.Contains(Roles.Supervisor))
        {
            var teamIds = await context.Users
                .Where(u => u.SupervisorId == currentUser.UserId)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            return query.Where(c => teamIds.Contains(c.OwnerId));
        }

        return query;
    }
}
