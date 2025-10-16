const { spawn } = require('child_process');
const path = require('path');

const apiPath = path.resolve(__dirname, '../dist/main.js');
const workerPath = path.resolve(__dirname, '../dist/worker.js');

function run(cmd, args, name) {
  const p = spawn(cmd, args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: process.env,
  });
  p.on('exit', (code, signal) => {
    console.log(`[${name}] exited code=${code} signal=${signal}`);
    process.exit(code ?? 1);
  });
  return p;
}

const api = run('node', [apiPath], 'API');
const worker = run('node', [workerPath], 'WORKER');

function shutdown(sig) {
  console.log(`[supervisor] received ${sig}, shutting down children...`);
  api.kill(sig);
  worker.kill(sig);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
