import 'reflect-metadata';
import { DataSource } from 'typeorm';

function getDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const u = process.env.POSTGRES_USER;
  const p = process.env.POSTGRES_PASSWORD;
  const db = process.env.POSTGRES_DB;
  const port = process.env.POSTGRES_PORT;
  const host = process.env.POSTGRES_HOST || 'localhost';

  if (u && p && db && port) {
    return `postgres://${u}:${p}@${host}:${port}/${db}`;
  }
  return null;
}

const url = getDatabaseUrl();
if (!url) {
  throw new Error(
    'DATABASE_URL is not set and could not be constructed from POSTGRES_* envs.',
  );
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url,
  synchronize: false,
  logging: false,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
});
