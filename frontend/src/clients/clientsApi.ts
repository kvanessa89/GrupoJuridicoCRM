import { httpClient } from '../api/httpClient';
import type { Client, ClientComment, ClientFormValues, StageHistoryEntry } from './types';

export function getClients() {
  return httpClient.get<Client[]>('/clients').then((res) => res.data);
}

export function getStageHistory() {
  return httpClient.get<StageHistoryEntry[]>('/clients/stage-history').then((res) => res.data);
}

export function getClientComments(clientId: number) {
  return httpClient.get<ClientComment[]>(`/clients/${clientId}/comments`).then((res) => res.data);
}

export function createClient(form: ClientFormValues) {
  return httpClient
    .post<number>('/clients', {
      nombre: form.nombre,
      apellidos: form.apellidos,
      email: form.email || null,
      telefono: form.telefono || null,
      whatsapp: form.whatsapp || null,
      sourceId: form.sourceId,
      stageId: form.stageId,
      ownerId: form.ownerId,
    })
    .then((res) => res.data);
}

// El backend no acepta StageId en el update — el cambio de etapa va por moveClient.
export function updateClient(id: number, form: ClientFormValues) {
  return httpClient.put(`/clients/${id}`, {
    id,
    nombre: form.nombre,
    apellidos: form.apellidos,
    email: form.email || null,
    telefono: form.telefono || null,
    whatsapp: form.whatsapp || null,
    sourceId: form.sourceId,
    ownerId: form.ownerId,
  });
}

export function moveClient(id: number, newStageId: number) {
  return httpClient.post(`/clients/${id}/move`, { newStageId });
}

export function setClientBoardVisibility(id: number, hidden: boolean) {
  return httpClient.post(`/clients/${id}/board-visibility`, { hidden });
}

export function deleteClient(id: number) {
  return httpClient.delete(`/clients/${id}`);
}

export function addClientComment(clientId: number, userId: string, text: string) {
  return httpClient
    .post<number>(`/clients/${clientId}/comments`, { userId, text })
    .then((res) => res.data);
}
