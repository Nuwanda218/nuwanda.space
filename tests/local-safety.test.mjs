import assert from 'node:assert/strict';
import test from 'node:test';
import { inspect } from 'node:util';

// 先在实现前执行：缺少模块应失败，建立安全边界的回归基线。
const { validateDatabaseEnv, requireResetConfirmation, validateLocalDockerEndpoint } = await import('../scripts/local-env.mjs');
const valid = {
  DATABASE_URL: 'postgresql://nuwanda_dev:local-password@127.0.0.1:5432/nuwanda_dev',
  DB_PORT: '5432',
  DB_PASSWORD: 'local-password',
  POSTGRES_ADMIN_PASSWORD: 'local-admin-password',
  SESSION_SECRET: 'x'.repeat(64),
  OSS_MODE: 'mock',
};
test('only the isolated loopback database is allowed', () => {
  assert.doesNotThrow(() => validateDatabaseEnv(valid));
  for (const target of [
    'postgresql://nuwanda_dev:local-password@production.example:5432/nuwanda_dev',
    'postgresql://nuwanda_dev:local-password@127.0.0.1:5432/production',
    'postgresql://postgres:local-password@127.0.0.1:5432/nuwanda_dev',
    'postgresql://nuwanda_dev:local-password@localhost:5432/nuwanda_dev',
    'postgresql://nuwanda_dev:local-password@127.0.0.1:5433/nuwanda_dev',
    'postgresql://nuwanda_dev:other-password@127.0.0.1:5432/nuwanda_dev',
    'postgresql://nuwanda_dev:local-password@127.0.0.1:5432/nuwanda_dev?host=production.example',
  ]) assert.throws(() => validateDatabaseEnv({ ...valid, DATABASE_URL: target }));
});
test('development secrets and mock OSS are required', () => {
  assert.throws(() => validateDatabaseEnv({ ...valid, SESSION_SECRET: 'short' }));
  assert.throws(() => validateDatabaseEnv({ ...valid, DB_PASSWORD: 'CHANGE_ME' }));
  assert.throws(() => validateDatabaseEnv({ ...valid, OSS_MODE: 'live' }));
});
test('reset requires an explicit local-only confirmation', () => {
  assert.throws(() => requireResetConfirmation([]));
  assert.doesNotThrow(() => requireResetConfirmation(['--confirm-local-reset']));
});
test('malformed connection strings never disclose their input', () => {
  const secret = 'DO_NOT_LEAK_TEST_PASSWORD';
  assert.throws(
    () => validateDatabaseEnv({ ...valid, DATABASE_URL: `postgresql://nuwanda_dev:${secret}@127.0.0.1:badport/nuwanda_dev` }),
    (error) => !inspect(error).includes(secret),
  );
});
test('Docker contexts must use strictly local socket endpoints', () => {
  for (const endpoint of ['npipe:////./pipe/dockerDesktopLinuxEngine', 'unix:///var/run/docker.sock']) {
    assert.doesNotThrow(() => validateLocalDockerEndpoint(endpoint));
  }
  for (const endpoint of ['npipe:////remote-host/pipe/docker_engine', 'unix://remote-host/var/run/docker.sock', 'tcp://127.0.0.1:2375', 'ssh://production', 'npipe:////./pipe/docker_engine?remote=host']) {
    assert.throws(() => validateLocalDockerEndpoint(endpoint));
  }
});
