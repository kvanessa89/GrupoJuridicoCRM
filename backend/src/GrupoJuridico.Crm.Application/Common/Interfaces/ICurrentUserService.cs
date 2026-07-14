namespace GrupoJuridico.Crm.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    IEnumerable<string> Roles { get; }
}
