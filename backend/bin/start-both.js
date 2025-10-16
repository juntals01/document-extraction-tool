const { spawn } = require('child_process');

function run(cmd, args, name) {
  const p = spawn(cmd, args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: process.env,
  });

  p.on('exit', (code, signal) => {
    console.log(`[${name}] exited code=${code} signal=${signal}`);
    // If one dies, bring the container down so Railway restarts it
    process.exit(code ?? 1);
  });

  return p;
}

const api = run('node', ['dist/main.js'], 'API');
const worker = run('node', ['dist/worker.js'], 'WORKER');

function shutdown(sig) {
  console.log(`[supervisor] received ${sig}, shutting down children...`);
  api.kill(sig);
  worker.kill(sig);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
