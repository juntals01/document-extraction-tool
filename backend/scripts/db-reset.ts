import 'reflect-metadata';
import { AppDataSource } from 'src/db/data-source';

async function main() {
  console.log('⏳ Connecting to database…');
  await AppDataSource.initialize();

  // Safer than dropDatabase() (doesn't require CREATE/DROP DB privileges)
  const qr = AppDataSource.createQueryRunner();
  try {
    console.log('🧹 Clearing database (dropping all tables)…');
    await qr.clearDatabase();
  } finally {
    await qr.release();
  }

  console.log('📦 Running migrations…');
  const results = await AppDataSource.runMigrations();
  results.forEach((r) => console.log(`✅ ${r.name}`));

  await AppDataSource.destroy();
  console.log('🎉 Reset complete.');
}

main().catch(async (err) => {
  console.error('❌ db:reset failed:', err);
  try {
    await AppDataSource.destroy();
  } catch {}
  process.exit(1);
});
