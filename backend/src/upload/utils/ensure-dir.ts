import { promises as fsp } from 'fs';

export async function ensureDir(dir: string) {
  await fsp.mkdir(dir, { recursive: true });
}
