import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../api/httpClient';
import type { Source } from './types';

function getSources() {
  return httpClient.get<Source[]>('/sources').then((res) => res.data);
}

export function useSourcesQuery() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
    select: (sources) => [...sources].sort((a, b) => a.order - b.order),
  });
}

function createSource(code: string, label: string, color: string) {
  return httpClient.post<number>('/sources', { code, label, color }).then((res) => res.data);
}

function updateSource(id: number, label: string, color: string) {
  return httpClient.put(`/sources/${id}`, { id, label, color });
}

function reorderSource(id: number, direction: 1 | -1) {
  return httpClient.post(`/sources/${id}/reorder`, direction, {
    headers: { 'Content-Type': 'application/json' },
  });
}

function deleteSource(id: number) {
  return httpClient.delete(`/sources/${id}`);
}

export function useCreateSourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, label, color }: { code: string; label: string; color: string }) =>
      createSource(code, label, color),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useUpdateSourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, label, color }: { id: number; label: string; color: string }) =>
      updateSource(id, label, color),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useReorderSourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: 1 | -1 }) => reorderSource(id, direction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useDeleteSourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });
}
