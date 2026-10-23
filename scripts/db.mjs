import { requireResetConfirmation, runCompose } from './local-env.mjs';

try {
  switch (process.argv[2]) {
    case 'up': runCompose('up', '-d', '--wait', '--wait-timeout', '90', 'postgres'); break;
    case 'stop': runCompose('stop', 'postgres'); break;
    case 'status': runCompose('ps', '--all'); break;
    case 'logs': runCompose('logs', '--tail', '60', 'postgres'); break;
    case 'reset':
      requireResetConfirmation(process.argv.slice(3));
      runCompose('down', '--volumes');
      runCompose('up', '-d', '--wait', '--wait-timeout', '90', 'postgres');
      break;
    default: throw new Error('Expected up, stop, status, logs, or reset.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
