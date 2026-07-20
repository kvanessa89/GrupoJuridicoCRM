using GrupoJuridico.Crm.Application.Clients.Commands.AddComment;
using GrupoJuridico.Crm.Application.Clients.Commands.CreateClient;
using GrupoJuridico.Crm.Application.Clients.Commands.DeleteClient;
using GrupoJuridico.Crm.Application.Clients.Commands.MoveClient;
using GrupoJuridico.Crm.Application.Clients.Commands.SetBoardVisibility;
using GrupoJuridico.Crm.Application.Clients.Commands.UpdateClient;
using GrupoJuridico.Crm.Application.Clients.Dtos;
using GrupoJuridico.Crm.Application.Clients.Queries.GetClientComments;
using GrupoJuridico.Crm.Application.Clients.Queries.GetClients;
using GrupoJuridico.Crm.Application.Clients.Queries.GetStageHistory;
using GrupoJuridico.Crm.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrupoJuridico.Crm.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ClientsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<List<ClientDto>>> GetAll()
        => Ok(await _mediator.Send(new GetClientsQuery()));

    [HttpGet("stage-history")]
    public async Task<ActionResult<List<StageHistoryEntryDto>>> GetStageHistory()
        => Ok(await _mediator.Send(new GetStageHistoryQuery()));

    [HttpGet("{id:int}/comments")]
    public async Task<ActionResult<List<ClientCommentDto>>> GetComments(int id)
        => Ok(await _mediator.Send(new GetClientCommentsQuery(id)));

    [HttpPost]
    public async Task<ActionResult<int>> Create(CreateClientCommand command)
        => Ok(await _mediator.Send(command));

    // Actualización completa: un asesor solo puede cambiar la etapa (endpoint /move).
    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Supervisor},{Roles.Editor}")]
    public async Task<IActionResult> Update(int id, UpdateClientCommand command)
    {
        if (id != command.Id) return BadRequest();
        await _mediator.Send(command);
        return NoContent();
    }

    // Acción central del tablero: mover un cliente arrastrado a otra etapa.
    [HttpPost("{id:int}/move")]
    public async Task<IActionResult> Move(int id, [FromBody] MoveClientRequest request)
    {
        await _mediator.Send(new MoveClientCommand { ClientId = id, NewStageId = request.NewStageId });
        return NoContent();
    }

    // Ocultar/restaurar en el tablero: solo supervisor y admin.
    [HttpPost("{id:int}/board-visibility")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Supervisor}")]
    public async Task<IActionResult> SetBoardVisibility(int id, [FromBody] SetBoardVisibilityRequest request)
    {
        await _mediator.Send(new SetClientBoardVisibilityCommand { ClientId = id, Hidden = request.Hidden });
        return NoContent();
    }

    [HttpPost("{id:int}/comments")]
    public async Task<ActionResult<int>> AddComment(int id, [FromBody] AddCommentRequest request)
        => Ok(await _mediator.Send(new AddCommentCommand { ClientId = id, UserId = request.UserId, Text = request.Text }));

    // Eliminar cliente: solo supervisor y admin.
    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Supervisor}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _mediator.Send(new DeleteClientCommand(id));
        return NoContent();
    }
}

public record MoveClientRequest(int NewStageId);
public record SetBoardVisibilityRequest(bool Hidden);
public record AddCommentRequest(Guid UserId, string Text);
