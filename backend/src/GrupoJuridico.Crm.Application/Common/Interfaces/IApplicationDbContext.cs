using GrupoJuridico.Crm.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Stage> Stages { get; }
    DbSet<Source> Sources { get; }
    DbSet<Client> Clients { get; }
    DbSet<Comment> Comments { get; }
    DbSet<StageHistoryEntry> StageHistoryEntries { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
