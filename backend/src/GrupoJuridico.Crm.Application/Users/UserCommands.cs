using GrupoJuridico.Crm.Application.Common;
using GrupoJuridico.Crm.Application.Common.Interfaces;
using GrupoJuridico.Crm.Domain.Constants;
using GrupoJuridico.Crm.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Application.Users;

public record CreateUserCommand : IRequest<Guid>
{
    public string Name { get; init; } = string.Empty;
    public string? Title { get; init; }
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string Color { get; init; } = "#2563EB";
    public Guid? SupervisorId { get; init; }
}

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Guid>
{
    private readonly UserManager<User> _userManager;
    public CreateUserCommandHandler(UserManager<User> userManager) => _userManager = userManager;

    public async Task<Guid> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        if (!EmailValidator.IsValid(request.Email))
            throw new InvalidOperationException("El correo electrónico no es válido.");

        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            Name = request.Name,
            Title = request.Title,
            Color = request.Color,
            SupervisorId = request.Role == Roles.Asesor ? request.SupervisorId : null,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(user, request.Role);
        return user.Id;
    }
}

public record UpdateUserCommand : IRequest
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Title { get; init; }
    public string Role { get; init; } = string.Empty;
    public string Color { get; init; } = "#2563EB";
    public Guid? SupervisorId { get; init; }
    public string? Password { get; init; }
}

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand>
{
    private readonly UserManager<User> _userManager;
    public UpdateUserCommandHandler(UserManager<User> userManager) => _userManager = userManager;

    public async Task Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(request.Id.ToString())
            ?? throw new KeyNotFoundException($"Usuario {request.Id} no encontrado.");

        user.Name = request.Name;
        user.Title = request.Title;
        user.Color = request.Color;
        user.SupervisorId = request.Role == Roles.Asesor ? request.SupervisorId : null;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            throw new InvalidOperationException(string.Join("; ", updateResult.Errors.Select(e => e.Description)));

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (!currentRoles.Contains(request.Role))
        {
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, request.Role);
        }

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, request.Password);
            if (!resetResult.Succeeded)
                throw new InvalidOperationException(string.Join("; ", resetResult.Errors.Select(e => e.Description)));
        }
    }
}

// Borra un usuario y reasigna todo lo que quedaría huérfano (FKs son Restrict, no Cascade):
// clientes en propiedad, historial de etapas, comentarios y reportes generados.
// - Asesor: por defecto se reasigna a su propio supervisor, salvo que se indique otro destino.
// - Supervisor: requiere ReassignToUserId (otro supervisor) para heredar a sus asesores
//   (les cambia el SupervisorId) y absorber lo que el supervisor eliminado tenía en propiedad.
// - Admin/Editor: solo requiere ReassignToUserId si de hecho tiene datos asociados.
public record DeleteUserCommand : IRequest
{
    public Guid Id { get; init; }
    public Guid? ReassignToUserId { get; init; }
}

public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly ICurrentUserService _currentUser;

    public DeleteUserCommandHandler(IApplicationDbContext context, UserManager<User> userManager, ICurrentUserService currentUser)
    {
        _context = context;
        _userManager = userManager;
        _currentUser = currentUser;
    }

    public async Task Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == _currentUser.UserId)
            throw new InvalidOperationException("No puedes eliminar tu propio usuario.");

        var user = await _userManager.FindByIdAsync(request.Id.ToString())
            ?? throw new KeyNotFoundException($"Usuario {request.Id} no encontrado.");

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? string.Empty;

        if (role == Roles.Admin)
        {
            var admins = await _userManager.GetUsersInRoleAsync(Roles.Admin);
            if (admins.Count <= 1)
                throw new InvalidOperationException("No puedes eliminar al único administrador.");
        }

        User? target = null;
        if (request.ReassignToUserId is Guid targetId)
        {
            if (targetId == request.Id)
                throw new InvalidOperationException("El usuario de reemplazo no puede ser el mismo que se elimina.");
            target = await _userManager.FindByIdAsync(targetId.ToString())
                ?? throw new KeyNotFoundException("Usuario de reemplazo no encontrado.");
        }

        if (role == Roles.Supervisor)
        {
            var subordinates = await _context.Users.Where(u => u.SupervisorId == user.Id).ToListAsync(cancellationToken);
            if (subordinates.Count > 0)
            {
                if (target is null)
                    throw new InvalidOperationException("Elige un supervisor de reemplazo para reasignar a sus asesores.");

                var targetRoles = await _userManager.GetRolesAsync(target);
                if (!targetRoles.Contains(Roles.Supervisor))
                    throw new InvalidOperationException("El usuario de reemplazo debe ser un supervisor.");

                foreach (var sub in subordinates) sub.SupervisorId = target.Id;
            }
        }
        else if (role == Roles.Asesor && target is null && user.SupervisorId is Guid supervisorId)
        {
            target = await _userManager.FindByIdAsync(supervisorId.ToString());
        }

        var ownedClients = await _context.Clients.Where(c => c.OwnerId == user.Id).ToListAsync(cancellationToken);
        var historyEntries = await _context.StageHistoryEntries.Where(h => h.OwnerId == user.Id).ToListAsync(cancellationToken);
        var comments = await _context.Comments.Where(c => c.UserId == user.Id).ToListAsync(cancellationToken);
        var snapshots = await _context.BoardSnapshots.Where(s => s.GeneratedByUserId == user.Id).ToListAsync(cancellationToken);

        var hasDependents = ownedClients.Count > 0 || historyEntries.Count > 0 || comments.Count > 0 || snapshots.Count > 0;
        if (hasDependents && target is null)
            throw new InvalidOperationException("Este usuario tiene clientes, comentarios o reportes asociados. Elige un usuario de reemplazo.");

        if (target is not null)
        {
            foreach (var c in ownedClients) c.OwnerId = target.Id;
            foreach (var h in historyEntries) h.OwnerId = target.Id;
            foreach (var cm in comments) cm.UserId = target.Id;
            foreach (var s in snapshots) s.GeneratedByUserId = target.Id;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var deleteResult = await _userManager.DeleteAsync(user);
        if (!deleteResult.Succeeded)
            throw new InvalidOperationException(string.Join("; ", deleteResult.Errors.Select(e => e.Description)));
    }
}
