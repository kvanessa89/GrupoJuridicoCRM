import { isEditor, type Role } from './roles';

// Igual que login() en el diseño original: el Editor aterriza en Clientes,
// el resto en el Tablero.
export function homeRouteFor(role: Role): string {
  return isEditor(role) ? '/clientes' : '/tablero';
}
