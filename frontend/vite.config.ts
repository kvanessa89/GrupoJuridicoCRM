import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Si el sitio de staging sirve el frontend desde una subcarpeta
  // (ej. https://host/app/), seteá VITE_BASE_PATH=/app/ en el .env del ambiente.
  // Si vive en la raíz del sub-sitio, dejalo sin definir (default '/').
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
  }
})
