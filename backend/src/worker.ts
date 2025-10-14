import 'reflect-metadata';

async function bootstrap() {
  // Put your queue consumers here (BullMQ, custom jobs, etc.)
  const name = process.env.WORKER_NAME ?? 'default-worker';
  console.log(`👷 Worker "${name}" started at ${new Date().toISOString()}`);

  // Keep process alive (replace with real consumers)
  process.stdin.resume();

  // Graceful shutdown
  const shutdown = (sig: string) => {
    console.log(`🛑 Worker received ${sig}, shutting down...`);
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
