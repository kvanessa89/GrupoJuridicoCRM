import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../api/httpClient';
import type { BoardSnapshot } from './boardSnapshotTypes';

function getBoardSnapshots() {
  return httpClient.get<BoardSnapshot[]>('/boardsnapshots').then((res) => res.data);
}

function generateBoardSnapshot() {
  return httpClient.post<number>('/boardsnapshots').then((res) => res.data);
}

function getCohortMonths() {
  return httpClient.get<string[]>('/boardsnapshots/cohort-months').then((res) => res.data);
}

function getCohortBoardSnapshots(month: string) {
  return httpClient.get<BoardSnapshot[]>('/boardsnapshots/cohort', { params: { month } }).then((res) => res.data);
}

export function useBoardSnapshotsQuery() {
  return useQuery({ queryKey: ['board-snapshots'], queryFn: getBoardSnapshots });
}

export function useGenerateBoardSnapshotMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateBoardSnapshot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board-snapshots'] }),
  });
}

export function useCohortMonthsQuery() {
  return useQuery({ queryKey: ['board-snapshots-cohort-months'], queryFn: getCohortMonths });
}

export function useCohortBoardSnapshotsQuery(month: string | null) {
  return useQuery({
    queryKey: ['board-snapshots-cohort', month],
    queryFn: () => getCohortBoardSnapshots(month!),
    enabled: !!month,
    // Mantiene el gráfico del mes anterior visible mientras carga el nuevo — si no,
    // `data` queda undefined entre queries, el gráfico cae al estado vacío, el div
    // del plot se desmonta, y al recibir los datos se remonta con el ancho por
    // defecto y salta al ancho real (se ve "raro" un instante al cambiar de mes).
    placeholderData: keepPreviousData,
  });
}
