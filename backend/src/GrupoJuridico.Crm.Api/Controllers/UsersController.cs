using GrupoJuridico.Crm.Application.Users;
using GrupoJuridico.Crm.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrupoJuridico.Crm.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    public UsersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll() => Ok(await _mediator.Send(new GetUsersQuery()));

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<Guid>> Create(CreateUserCommand command) => Ok(await _mediator.Send(command));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(Guid id, UpdateUserCommand command)
    {
        if (id != command.Id) return BadRequest();
        await _mediator.Send(command);
        return NoContent();
    }
}
