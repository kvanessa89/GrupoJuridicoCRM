import type { Client, StageHistoryEntry } from '../clients/types';

const HOUR_MS = 3600 * 1000;

export interface StageSegment {
  stageId: number;
  ownerId: string;
  hours: number;
}

// Closed segments come from the backend; each client's current stage is an
// "open" segment running from stageEnteredAt to now — added here so averages
// reflect time still accruing in the client's present stage.
export function buildSegments(clients: Client[], history: StageHistoryEntry[]): StageSegment[] {
  const now = Date.now();
  const closed = history.map((h) => ({
    stageId: h.stageId,
    ownerId: h.ownerId,
    hours: Math.max(0, (new Date(h.exitedAt).getTime() - new Date(h.enteredAt).getTime()) / HOUR_MS),
  }));
  const open = clients.map((c) => ({
    stageId: c.stageId,
    ownerId: c.ownerId,
    hours: Math.max(0, (now - new Date(c.stageEnteredAt).getTime()) / HOUR_MS),
  }));
  return [...closed, ...open];
}

export function average(segments: StageSegment[]): number {
  if (segments.length === 0) return 0;
  return segments.reduce((sum, s) => sum + s.hours, 0) / segments.length;
}

export function fmtHours(hours: number): string {
  if (hours < 1) return '< 1 h';
  if (hours < 24) return `${Math.round(hours)} h`;
  return `${Math.floor(hours / 24)} d ${Math.round(hours % 24)} h`;
}
