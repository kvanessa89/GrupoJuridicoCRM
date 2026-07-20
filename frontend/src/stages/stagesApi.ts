import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../api/httpClient';
import type { Stage } from './types';

function getStages() {
  return httpClient.get<Stage[]>('/stages').then((res) => res.data);
}

export function useStagesQuery() {
  return useQuery({
    queryKey: ['stages'],
    queryFn: getStages,
    select: (stages) => [...stages].sort((a, b) => a.order - b.order),
  });
}

function createStage(name: string, color: string) {
  return httpClient.post<number>('/stages', { name, color }).then((res) => res.data);
}

function updateStage(id: number, name: string, color: string) {
  return httpClient.put(`/stages/${id}`, { id, name, color });
}

function reorderStage(id: number, direction: 1 | -1) {
  return httpClient.post(`/stages/${id}/reorder`, direction, {
    headers: { 'Content-Type': 'application/json' },
  });
}

function deleteStage(id: number) {
  return httpClient.delete(`/stages/${id}`);
}

function setStageHideable(id: number, hideable: boolean) {
  return httpClient.post(`/stages/${id}/hideable`, { hideable });
}

export function useCreateStageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => createStage(name, color),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}

export function useUpdateStageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, color }: { id: number; name: string; color: string }) =>
      updateStage(id, name, color),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}

export function useReorderStageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: 1 | -1 }) => reorderStage(id, direction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}

export function useDeleteStageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteStage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useSetStageHideableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hideable }: { id: number; hideable: boolean }) => setStageHideable(id, hideable),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });
}
