import ws from 'ws';
import * as schema from '../shared/schema';

// Driver Imports: Neon (serverless HTTP) & native pg for direkte lokale Verbindung
import { neon, Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';

neonConfig.webSocketConstructor = ws;

// Windows-kompatible Datenbankverbindung mit Fallback
let pool: NeonPool | PgPool | null = null;
let dbInstance: any = null;
let driver: 'neon' | 'pg' | 'mock' = 'mock';

if (!process.env.DATABASE_URL) {
  console.warn('[DB] DATABASE_URL not set, using mock database for development');
  // Mock-Datenbank für Entwicklung
  dbInstance = {
    select: () => ({ from: () => Promise.resolve([]) }),
    insert: () => ({ values: () => Promise.resolve([]) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
  };
} else {
  const url = process.env.DATABASE_URL;
  const isNeon = /\.neon\.tech/.test(url || '');
  try {
    if (!url?.startsWith('postgresql://')) throw new Error('Invalid DATABASE_URL format');
    if (isNeon) {
      // Neon serverless HTTP/WebSocket
      pool = new NeonPool({ connectionString: url });
      dbInstance = drizzleNeon({ client: pool, schema });
      driver = 'neon';
      console.log('[DB] Using Neon serverless driver');
    } else {
      // Native pg TCP Verbindung für lokale/Netcup Postgres
      pool = new PgPool({ connectionString: url });
      dbInstance = drizzlePg(pool, { schema });
      driver = 'pg';
      console.log('[DB] Using native pg driver');
    }
  } catch (error) {
    console.warn('[DB] Failed to connect to database, using mock:', error);
    if (process.env.NODE_ENV === 'development') {
      dbInstance = {
        select: () => ({ from: () => Promise.resolve([]) }),
        insert: () => ({ values: () => Promise.resolve([]) }),
        update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
        delete: () => ({ where: () => Promise.resolve([]) }),
      };
      driver = 'mock';
    } else {
      throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
    }
  }
}

export const dbDriver = driver;

export { pool };
export const db = dbInstance;
