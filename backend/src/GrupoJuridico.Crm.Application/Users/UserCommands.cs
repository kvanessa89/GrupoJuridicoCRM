using GrupoJuridico.Crm.Domain.Constants;
using GrupoJuridico.Crm.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

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
