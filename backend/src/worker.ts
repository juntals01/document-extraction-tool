import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'error', 'warn'],
  });

  const name = process.env.WORKER_NAME ?? 'default-worker';
  console.log(`👷 Worker "${name}" started at ${new Date().toISOString()}`);

  const shutdown = (sig: string) => {
    console.log(`🛑 Worker received ${sig}, shutting down...`);
    app.close().finally(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
