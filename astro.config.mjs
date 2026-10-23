import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url)).replaceAll('\\', '/');

export default defineConfig({
  site: 'https://nuwanda.space',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  // Keep verification assets independently inspectable and requestable over HTTP.
  build: { inlineStylesheets: 'never' },
  server: { host: '127.0.0.1', port: 4321 },
  vite: {
    server: {
      strictPort: true,
      fs: {
        // Retain Vite defaults and exclude this repository's local/operational material.
        deny: [
          '.env', '.env.*', '*.{crt,pem,key}', '**/.git/**', '**/*_nginx.zip',
          ...['.local/**', '.deploy-private/**', 'docs/**', 'deploy/**', 'compose.yaml', 'package*.json']
            .map((pattern) => projectRoot + pattern),
        ],
      },
    },
    build: { assetsInlineLimit: 0 },
  },
});
