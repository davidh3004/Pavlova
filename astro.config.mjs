import 'dotenv/config';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://pavlovalovetampa.com',
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: Number(process.env.PORT) || 4321,
    host: '0.0.0.0',
  },
});
