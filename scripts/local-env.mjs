import { existsSync, readFileSync } from 'node:fs';
import { delimiter, dirname, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
export const envFile = join(root, '.env.local');
export function validateDatabaseEnv(env) {
  let url;
  let password;
  try {
    url = new URL(env.DATABASE_URL);
    password = decodeURIComponent(url.password);
  } catch {
    // ERR_INVALID_URL includes .input; never propagate it or attach it as cause.
    throw new Error('Invalid local DATABASE_URL syntax; connection details suppressed.');
  }
  if (url.protocol !== 'postgresql:' || url.hostname !== '127.0.0.1' ||
      url.pathname !== '/nuwanda_dev' || url.username !== 'nuwanda_dev' ||
      url.port !== env.DB_PORT || url.search || url.hash ||
      password !== env.DB_PASSWORD ||
      !/^\d+$/.test(env.DB_PORT) || Number(env.DB_PORT) < 1024 || Number(env.DB_PORT) > 65535) {
    throw new Error('Refusing database target: expected isolated nuwanda_dev at 127.0.0.1 and matching DB_PORT/password.');
  }
  for (const key of ['DB_PASSWORD', 'POSTGRES_ADMIN_PASSWORD']) {
    if (!env[key] || env[key].length < 12 || /CHANGE_ME/i.test(env[key])) throw new Error(`Invalid local ${key}; run npm run setup.`);
  }
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 64 || /CHANGE_ME/.test(env.SESSION_SECRET)) throw new Error('Invalid local SESSION_SECRET.');
  if (env.OSS_MODE !== 'mock') throw new Error('This environment only permits OSS_MODE=mock.');
  return env;
}
export function loadLocalEnv() {
  if (!existsSync(envFile)) throw new Error('Missing .env.local; run npm run setup.');
  // Deliberately do not merge shell DATABASE_URL/PG* variables (could reference production).
  return validateDatabaseEnv(parseEnv(readFileSync(envFile, 'utf8')));
}
export function requireResetConfirmation(args) {
  if (!args.includes('--confirm-local-reset')) throw new Error('Reset erases ONLY this local Compose volume. Add --confirm-local-reset deliberately.');
}
export function dockerBinary() {
  const candidates = ['docker'];
  if (process.platform === 'win32') candidates.push('D:\\Docker\\resources\\bin\\docker.exe', 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe');
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8', windowsHide: true });
    if (result.status === 0) return candidate;
  }
  throw new Error('Docker CLI unavailable. Install/start Docker manually or add its existing resources/bin to PATH.');
}
export function localDocker() {
  if (process.env.DOCKER_HOST) throw new Error('Unset DOCKER_HOST: this workflow requires a local Docker context.');
  const binary = dockerBinary();
  const result = spawnSync(binary, ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error('Cannot inspect Docker context.');
  validateLocalDockerEndpoint(result.stdout.trim());
  return binary;
}
export function validateLocalDockerEndpoint(endpoint) {
  const localPipe = /^npipe:\/{4}\.\/pipe\/[^/\\?#\s\0]+$/.test(endpoint);
  const localUnix = /^unix:\/\/\/[^/][^?#\s\0]*$/.test(endpoint);
  if (!localPipe && !localUnix) throw new Error('Refusing nonlocal Docker endpoint. Select local Docker Desktop/default context.');
}
export function composeArgs(...args) {
  return ['compose', '--project-directory', root, '--project-name', 'nuwanda-space-local', '--file', join(root, 'compose.yaml'), '--env-file', envFile, ...args];
}
export function runCompose(...args) {
  const localEnv = loadLocalEnv();
  const binary = localDocker();
  // Docker's credential helper lives beside its CLI on this Windows installation.
  const path = isAbsolute(binary) ? `${dirname(binary)}${delimiter}${process.env.PATH || ''}` : process.env.PATH;
  const result = spawnSync(binary, composeArgs(...args), { cwd: root, env: { ...process.env, ...localEnv, PATH: path }, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Docker Compose failed (exit ${result.status}).`);
}
