import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 })
  : null;

export const connectDatabase = async () => {
  if (!pool) return false;
  await pool.query('SELECT 1');
  const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db');
  await pool.query(await fs.readFile(path.join(directory, 'schema.sql'), 'utf8'));
  await pool.query(await fs.readFile(path.join(directory, 'seed.sql'), 'utf8'));
  return true;
};
