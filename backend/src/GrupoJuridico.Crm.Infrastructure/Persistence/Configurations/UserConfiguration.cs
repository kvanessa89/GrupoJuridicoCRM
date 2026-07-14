using GrupoJuridico.Crm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrupoJuridico.Crm.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.Property(u => u.Name).IsRequired().HasMaxLength(150);
        builder.Property(u => u.Title).HasMaxLength(150);
        builder.Property(u => u.Color).IsRequired().HasMaxLength(9);

        builder.HasOne(u => u.Supervisor)
            .WithMany(u => u.Advisors)
            .HasForeignKey(u => u.SupervisorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
