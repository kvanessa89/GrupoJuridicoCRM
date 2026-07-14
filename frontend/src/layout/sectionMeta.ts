import { isAdmin, isSupervisor, type Role } from '../auth/roles';

interface SectionMeta {
  title: string;
  subtitle: string;
}

export function sectionMetaFor(pathname: string, role: Role): SectionMeta {
  if (pathname.startsWith('/panel')) {
    return {
      title: 'Panel',
      subtitle: isAdmin(role)
        ? 'Resumen de todo el equipo'
        : isSupervisor(role)
          ? 'Resumen de tu equipo'
          : 'Resumen de tu actividad',
    };
  }
  if (pathname.startsWith('/tablero')) {
    return { title: 'Tablero', subtitle: 'Arrastra los clientes entre etapas del tablero' };
  }
  if (pathname.startsWith('/clientes')) {
    return {
      title: 'Clientes',
      subtitle: isAdmin(role)
        ? 'Todos los clientes del equipo'
        : isSupervisor(role)
          ? 'Clientes de tu equipo'
          : 'Tus clientes asignados',
    };
  }
  if (pathname.startsWith('/usuarios')) {
    return {
      title: 'Usuarios',
      subtitle: isAdmin(role) ? 'Equipo de asesores y su actividad' : 'Tu equipo de asesores',
    };
  }
  if (pathname.startsWith('/configuracion')) {
    return { title: 'Configuración del tablero', subtitle: 'Define las etapas del tablero' };
  }
  return { title: '', subtitle: '' };
}
