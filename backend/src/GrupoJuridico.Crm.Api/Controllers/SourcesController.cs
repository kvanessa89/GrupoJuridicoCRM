using GrupoJuridico.Crm.Application.Sources;
using GrupoJuridico.Crm.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrupoJuridico.Crm.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SourcesController : ControllerBase
{
    private readonly IMediator _mediator;
    public SourcesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<List<SourceDto>>> GetAll() => Ok(await _mediator.Send(new GetSourcesQuery()));

    [HttpPost]
    public async Task<ActionResult<int>> Create(CreateSourceCommand command) => Ok(await _mediator.Send(command));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateSourceCommand command)
    {
        if (id != command.Id) return BadRequest();
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpPost("{id:int}/reorder")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Reorder(int id, [FromBody] int direction)
    {
        await _mediator.Send(new ReorderSourceCommand(id, direction));
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _mediator.Send(new DeleteSourceCommand(id));
        return NoContent();
    }
}
