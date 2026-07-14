using GrupoJuridico.Crm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GrupoJuridico.Crm.Infrastructure.Persistence.Configurations;

public class SourceConfiguration : IEntityTypeConfiguration<Source>
{
    public void Configure(EntityTypeBuilder<Source> builder)
    {
        builder.Property(s => s.Code).IsRequired().HasMaxLength(10);
        builder.Property(s => s.Label).IsRequired().HasMaxLength(150);
        builder.Property(s => s.Color).IsRequired().HasMaxLength(9);
    }
}
