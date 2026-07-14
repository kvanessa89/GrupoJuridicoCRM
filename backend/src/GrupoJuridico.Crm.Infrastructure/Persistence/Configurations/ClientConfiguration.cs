using GrupoJuridico.Crm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrupoJuridico.Crm.Infrastructure.Persistence.Configurations;

public class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Apellidos).IsRequired().HasMaxLength(150);
        builder.Property(c => c.Email).HasMaxLength(200);
        builder.Property(c => c.Telefono).HasMaxLength(30);
        builder.Property(c => c.Whatsapp).HasMaxLength(30);

        builder.HasOne(c => c.Source)
            .WithMany(s => s.Clients)
            .HasForeignKey(c => c.SourceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Stage)
            .WithMany(s => s.Clients)
            .HasForeignKey(c => c.StageId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Owner)
            .WithMany(u => u.OwnedClients)
            .HasForeignKey(c => c.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Comments)
            .WithOne(cm => cm.Client)
            .HasForeignKey(cm => cm.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.StageHistory)
            .WithOne(h => h.Client)
            .HasForeignKey(h => h.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => c.Email);
    }
}
