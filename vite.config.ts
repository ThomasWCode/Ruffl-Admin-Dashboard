import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  if (
    mode === 'production' &&
    (!env.VITE_API_URL || env.VITE_API_URL.includes('localhost'))
  ) {
    throw new Error('VITE_API_URL must be the deployed HTTPS backend URL.');
  }
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
  };
});
