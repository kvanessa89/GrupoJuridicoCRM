using GrupoJuridico.Crm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrupoJuridico.Crm.Infrastructure.Persistence.Configurations;

public class StageHistoryEntryConfiguration : IEntityTypeConfiguration<StageHistoryEntry>
{
    public void Configure(EntityTypeBuilder<StageHistoryEntry> builder)
    {
        builder.HasOne(h => h.Stage)
            .WithMany()
            .HasForeignKey(h => h.StageId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.Owner)
            .WithMany()
            .HasForeignKey(h => h.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
