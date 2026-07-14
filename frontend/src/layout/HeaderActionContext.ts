import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ReactNode } from 'react';

export interface LayoutContextValue {
  setHeaderAction: (node: ReactNode | null) => void;
}

export function useLayoutContext(): LayoutContextValue {
  return useOutletContext<LayoutContextValue>();
}

// Páginas hijas registran el botón de acción del header (ej. "+ Nuevo cliente")
// y lo limpian automáticamente al desmontar o cuando `node` cambia.
export function useHeaderAction(node: ReactNode | null): void {
  const { setHeaderAction } = useLayoutContext();
  useEffect(() => {
    setHeaderAction(node);
    return () => setHeaderAction(null);
  }, [node, setHeaderAction]);
}
