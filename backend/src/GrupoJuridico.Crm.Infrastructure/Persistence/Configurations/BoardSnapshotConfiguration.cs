using GrupoJuridico.Crm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrupoJuridico.Crm.Infrastructure.Persistence.Configurations;

public class BoardSnapshotConfiguration : IEntityTypeConfiguration<BoardSnapshot>
{
    public void Configure(EntityTypeBuilder<BoardSnapshot> builder)
    {
        builder.HasOne(s => s.GeneratedByUser)
            .WithMany()
            .HasForeignKey(s => s.GeneratedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.Entries)
            .WithOne(e => e.BoardSnapshot)
            .HasForeignKey(e => e.BoardSnapshotId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class BoardSnapshotEntryConfiguration : IEntityTypeConfiguration<BoardSnapshotEntry>
{
    public void Configure(EntityTypeBuilder<BoardSnapshotEntry> builder)
    {
        builder.Property(e => e.StageName).IsRequired().HasMaxLength(100);
        builder.Property(e => e.StageColor).IsRequired().HasMaxLength(20);
    }
}
