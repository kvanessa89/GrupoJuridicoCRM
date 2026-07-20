export interface Client {
  id: number;
  nombre: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  whatsapp: string | null;
  sourceId: number;
  stageId: number;
  ownerId: string;
  createdAt: string;
  stageEnteredAt: string;
  hiddenFromBoard: boolean;
}

export interface StageHistoryEntry {
  clientId: number;
  stageId: number;
  ownerId: string;
  enteredAt: string;
  exitedAt: string;
}

export interface ClientComment {
  id: number;
  userId: string;
  text: string;
  createdAt: string;
}

export interface ClientFormValues {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  whatsapp: string;
  sourceId: number;
  stageId: number;
  ownerId: string;
}
