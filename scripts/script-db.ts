import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

export interface ScriptDb {
  db: any;
  sql: any;
  driver: 'neon' | 'pg';
}

export function getScriptDb(): ScriptDb {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  const isNeon = /\.neon\.tech/.test(url);
  if (isNeon) {
    const sql = neon(url);
    const db = drizzleNeon(sql, { schema });
    return { db, sql, driver: 'neon' };
  }
  const pool = new PgPool({ connectionString: url });
  const db = drizzlePg(pool, { schema });
  const sql = (strings: TemplateStringsArray, ...values: any[]) => {
    const text = strings.reduce((acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ''), '');
    return pool.query(text, values).then(r => r.rows);
  };
  return { db, sql, driver: 'pg' };
}
