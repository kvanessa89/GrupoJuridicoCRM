import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './clientsApi';
import type { Client, ClientFormValues } from './types';

export function useClientsQuery() {
  return useQuery({ queryKey: ['clients'], queryFn: api.getClients });
}

export function useStageHistoryQuery() {
  return useQuery({ queryKey: ['stage-history'], queryFn: api.getStageHistory });
}

export function useClientCommentsQuery(clientId: number | null) {
  return useQuery({
    queryKey: ['client-comments', clientId],
    queryFn: () => api.getClientComments(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: ClientFormValues) => api.createClient(form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: number; form: ClientFormValues }) => api.updateClient(id, form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useMoveClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId }: { id: number; stageId: number }) => api.moveClient(id, stageId),
    onMutate: ({ id, stageId }) => {
      // Not awaited on purpose: patching the cache must happen synchronously,
      // in the same tick as BoardPage clearing activeCardId, or React commits
      // an in-between frame with the drag overlay gone but the old stageId
      // still showing, which reads as the card snapping back to its old column.
      queryClient.cancelQueries({ queryKey: ['clients'] });
      const previousClients = queryClient.getQueryData<Client[]>(['clients']);
      queryClient.setQueryData<Client[]>(['clients'], (old) =>
        old?.map((c) =>
          c.id === id ? { ...c, stageId, stageEnteredAt: new Date().toISOString() } : c,
        ),
      );
      return { previousClients };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousClients) queryClient.setQueryData(['clients'], context.previousClients);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useSetBoardVisibilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }: { id: number; hidden: boolean }) => api.setClientBoardVisibility(id, hidden),
    onMutate: ({ id, hidden }) => {
      queryClient.cancelQueries({ queryKey: ['clients'] });
      const previousClients = queryClient.getQueryData<Client[]>(['clients']);
      queryClient.setQueryData<Client[]>(['clients'], (old) =>
        old?.map((c) => (c.id === id ? { ...c, hiddenFromBoard: hidden } : c)),
      );
      return { previousClients };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousClients) queryClient.setQueryData(['clients'], context.previousClients);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteClient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useAddCommentMutation(clientId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, text }: { userId: string; text: string }) =>
      api.addClientComment(clientId!, userId, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-comments', clientId] }),
  });
}
