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

            return query.Where(c => c.OwnerId == currentUser.UserId || teamIds.Contains(c.OwnerId));
        }

        return query;
    }

    // Autorización a nivel de comando (move/editar/comentar/eliminar/crear): admin y editor sin
    // restricción, asesor solo sus propios clientes, supervisor los suyos o los de sus asesores.
    public static async Task<bool> CanAccessAsync(
        Guid ownerId,
        ICurrentUserService currentUser,
        IApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        if (currentUser.Roles.Contains(Roles.Admin) || currentUser.Roles.Contains(Roles.Editor))
            return true;

        if (currentUser.Roles.Contains(Roles.Asesor))
            return ownerId == currentUser.UserId;

        if (currentUser.Roles.Contains(Roles.Supervisor))
        {
            if (ownerId == currentUser.UserId) return true;
            return await context.Users.AnyAsync(u => u.Id == ownerId && u.SupervisorId == currentUser.UserId, cancellationToken);
        }

        return false;
    }
}
