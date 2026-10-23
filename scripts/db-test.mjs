import assert from 'node:assert/strict';
import pg from 'pg';
import { loadLocalEnv } from './local-env.mjs';

const env = loadLocalEnv();
const client = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000, statement_timeout: 5000 });
try {
  await client.connect();
  const result = await client.query(`SELECT current_database() AS database, current_user AS username, 1 + 1 AS answer, rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = current_user`);
  assert.deepEqual(result.rows[0], { database: 'nuwanda_dev', username: 'nuwanda_dev', answer: 2, rolsuper: false, rolcreatedb: false, rolcreaterole: false });
  await client.query('BEGIN');
  await client.query('CREATE TEMP TABLE local_smoke (value integer NOT NULL)');
  await client.query('INSERT INTO local_smoke VALUES ($1)', [42]);
  assert.equal((await client.query('SELECT value FROM local_smoke')).rows[0].value, 42);
  await client.query('ROLLBACK');
  console.log('PASS PostgreSQL TCP/password auth, SELECT 1+1=2, restricted development role, temporary write/read + rollback.');
} catch (error) {
  console.error(`FAIL local PostgreSQL (${error.code || error.name}); check npm run db:status / db:logs. No credentials printed.`);
  process.exitCode = 1;
} finally {
  await client.end();
}
