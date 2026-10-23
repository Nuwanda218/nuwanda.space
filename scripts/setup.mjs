import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { envFile, loadLocalEnv } from './local-env.mjs';

if (existsSync(envFile)) {
  loadLocalEnv();
  console.log('Existing .env.local validated; no values overwritten.');
} else {
  let port;
  for (const candidate of [5432, 5433, 5434]) {
    const available = await new Promise((resolve, reject) => {
      const server = createServer();
      server.once('error', (error) => error.code === 'EADDRINUSE' ? resolve(false) : reject(error));
      server.listen(candidate, '127.0.0.1', () => server.close(() => resolve(true)));
    });
    if (available) { port = candidate; break; }
  }
  if (!port) throw new Error('Local ports 5432-5434 occupied. Choose a free DB_PORT explicitly.');
  const password = randomBytes(24).toString('hex');
  const contents = [
    '# Generated local-only secrets. Do not commit or upload.',
    `DB_PORT=${port}`, `DB_PASSWORD=${password}`,
    `POSTGRES_ADMIN_PASSWORD=${randomBytes(24).toString('hex')}`,
    `DATABASE_URL=postgresql://nuwanda_dev:${password}@127.0.0.1:${port}/nuwanda_dev`,
    `SESSION_SECRET=${randomBytes(32).toString('hex')}`,
    'OSS_MODE=mock', 'OSS_REGION=cn-zhangjiakou', 'OSS_BUCKET=example-local-bucket',
    'OSS_ENDPOINT=https://oss.example.invalid', 'OSS_ACCESS_KEY_ID=', 'OSS_ACCESS_KEY_SECRET=', '',
  ].join('\n');
  writeFileSync(envFile, contents, { flag: 'wx', mode: 0o600 });
  loadLocalEnv();
  console.log(`Created ignored .env.local with random secrets; PostgreSQL port ${port}.`);
}
