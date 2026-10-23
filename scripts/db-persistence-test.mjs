import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { loadLocalEnv, runCompose } from './local-env.mjs';

// Opt-in integration check: briefly interrupts ONLY the isolated local database.
const env = loadLocalEnv();
const schema = `local_smoke_${randomUUID().replaceAll('-', '')}`;
const marker = randomUUID();
const connect = async () => {
  const client = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000, statement_timeout: 5000 });
  await client.connect();
  return client;
};
let created = false;
try {
  const first = await connect();
  try {
    await first.query(`CREATE SCHEMA ${schema}`);
    created = true;
    await first.query(`CREATE TABLE ${schema}.probe (value text NOT NULL)`);
    await first.query(`INSERT INTO ${schema}.probe VALUES ($1)`, [marker]);
  } finally { await first.end(); }
  runCompose('stop', 'postgres');
  runCompose('up', '-d', '--force-recreate', '--wait', '--wait-timeout', '90', 'postgres');
  const second = await connect();
  try {
    assert.equal((await second.query(`SELECT value FROM ${schema}.probe`)).rows[0].value, marker);
  } finally { await second.end(); }
  console.log('PASS persisted SQL marker survived stop + container recreation on the named volume.');
} catch (error) {
  console.error(`FAIL local persistence test (${error.code || error.name}); inspect db:status / db:logs.`);
  process.exitCode = 1;
} finally {
  if (created) {
    const cleanup = await connect();
    try {
      // Only the unique schema created above is removed, never an existing user schema.
      await cleanup.query(`DROP TABLE ${schema}.probe`);
      await cleanup.query(`DROP SCHEMA ${schema}`);
    } finally { await cleanup.end(); }
  }
}
