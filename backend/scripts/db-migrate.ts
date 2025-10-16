import 'reflect-metadata';
import { AppDataSource } from 'src/db/data-source';

async function main() {
  console.log('⏳ Connecting to database…');
  await AppDataSource.initialize();
  console.log('📦 Running migrations…');
  const results = await AppDataSource.runMigrations();
  results.forEach((r) => console.log(`✅ ${r.name}`));
  await AppDataSource.destroy();
  console.log('✨ Done.');
}

main().catch(async (err) => {
  console.error('❌ db:migrate failed:', err);
  try {
    await AppDataSource.destroy();
  } catch {}
  process.exit(1);
});
