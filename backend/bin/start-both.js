const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ⬇️ your build outputs are here:
const apiPath = path.resolve(__dirname, '../dist/src/main.js');
const workerPath = path.resolve(__dirname, '../dist/src/worker.js');

function assertExists(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`[start-both] Missing ${label}: ${p}`);
    process.exit(1);
  }
}
assertExists(apiPath, 'API build output');
assertExists(workerPath, 'Worker build output');

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
