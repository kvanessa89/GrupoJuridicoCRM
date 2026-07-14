using GrupoJuridico.Crm.Application.Stages;
using GrupoJuridico.Crm.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrupoJuridico.Crm.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StagesController : ControllerBase
{
    private readonly IMediator _mediator;
    public StagesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<List<StageDto>>> GetAll() => Ok(await _mediator.Send(new GetStagesQuery()));

    [HttpPost]
    public async Task<ActionResult<int>> Create(CreateStageCommand command) => Ok(await _mediator.Send(command));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateStageCommand command)
    {
        if (id != command.Id) return BadRequest();
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpPost("{id:int}/reorder")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Reorder(int id, [FromBody] int direction)
    {
        await _mediator.Send(new ReorderStageCommand(id, direction));
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        await _mediator.Send(new DeleteStageCommand(id));
        return NoContent();
    }
}
