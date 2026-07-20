using GrupoJuridico.Crm.Application.Common.Interfaces;
using GrupoJuridico.Crm.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Stage> Stages => Set<Stage>();
    public DbSet<Source> Sources => Set<Source>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<StageHistoryEntry> StageHistoryEntries => Set<StageHistoryEntry>();
    public DbSet<BoardSnapshot> BoardSnapshots => Set<BoardSnapshot>();
    public DbSet<BoardSnapshotEntry> BoardSnapshotEntries => Set<BoardSnapshotEntry>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
