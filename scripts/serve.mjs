// Imported environment credentials are not required by the current runtime smoke routes.
process.env.HOST = '127.0.0.1';
process.env.PORT ||= '4322';
await import('../dist/server/entry.mjs');
