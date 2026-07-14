import { httpClient } from '../api/httpClient';
import type { LoginResponse } from './types';

export function login(email: string, password: string) {
  return httpClient
    .post<LoginResponse>('/auth/login', { email, password })
    .then((res) => res.data);
}
