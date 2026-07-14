import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../api/httpClient';
import { Roles } from '../auth/roles';
import type { User, UserFormValues } from './types';

function getUsers() {
  return httpClient.get<User[]>('/users').then((res) => res.data);
}

export function useUsersQuery() {
  return useQuery({ queryKey: ['users'], queryFn: getUsers });
}

function createUser(form: UserFormValues) {
  return httpClient
    .post<string>('/users', {
      name: form.name,
      title: form.title || null,
      email: form.email,
      password: form.password,
      role: form.role,
      color: form.color,
      supervisorId: form.role === Roles.Asesor ? form.supervisorId : null,
    })
    .then((res) => res.data);
}

function updateUser(id: string, form: UserFormValues) {
  return httpClient.put(`/users/${id}`, {
    id,
    name: form.name,
    title: form.title || null,
    role: form.role,
    color: form.color,
    supervisorId: form.role === Roles.Asesor ? form.supervisorId : null,
    password: form.password || null,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: UserFormValues) => createUser(form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: UserFormValues }) => updateUser(id, form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
