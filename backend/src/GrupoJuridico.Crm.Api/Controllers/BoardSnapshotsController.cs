using GrupoJuridico.Crm.Application.BoardSnapshots;
using GrupoJuridico.Crm.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrupoJuridico.Crm.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class BoardSnapshotsController : ControllerBase
{
    private readonly IMediator _mediator;
    public BoardSnapshotsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<List<BoardSnapshotDto>>> GetAll()
        => Ok(await _mediator.Send(new GetBoardSnapshotsQuery()));

    [HttpPost]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Supervisor}")]
    public async Task<ActionResult<int>> Generate()
        => Ok(await _mediator.Send(new GenerateBoardSnapshotCommand()));

    [HttpGet("cohort-months")]
    public async Task<ActionResult<List<string>>> GetCohortMonths()
        => Ok(await _mediator.Send(new GetClientEntryMonthsQuery()));

    [HttpGet("cohort")]
    public async Task<ActionResult<List<BoardSnapshotDto>>> GetCohort([FromQuery] string month)
        => Ok(await _mediator.Send(new GetCohortBoardSnapshotsQuery { Month = month }));
}
