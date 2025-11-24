// Zentrale Datenbankverbindung für Windows-Kompatibilität
import { neon } from '@neondatabase/serverless';

let sqlInstance: any = null;
let isConnected = false;

export function getDatabaseConnection() {
  if (sqlInstance) {
    return sqlInstance;
  }

  const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!DATABASE_URL) {
    console.warn('[DB] No DATABASE_URL found, using mock database');
    sqlInstance = createMockSQL();
    return sqlInstance;
  }

  // Validiere DATABASE_URL Format
  if (!DATABASE_URL.includes('://') || !DATABASE_URL.startsWith('postgresql://')) {
    console.warn('[DB] Invalid DATABASE_URL format, using mock database');
    console.warn('[DB] Expected format: postgresql://user:password@host:port/database');
    sqlInstance = createMockSQL();
    return sqlInstance;
  }

  try {
    sqlInstance = neon(DATABASE_URL);
    isConnected = true;
    console.log('[DB] Database connection established');
    return sqlInstance;
  } catch (error) {
    console.warn('[DB] Failed to connect to database, using mock:', error);
    sqlInstance = createMockSQL();
    return sqlInstance;
  }
}

function createMockSQL() {
  // Mock SQL-Objekt für Entwicklung ohne Datenbank
  return {
    template: () => Promise.resolve([]),
    query: () => Promise.resolve({ rows: [], rowCount: 0 }),
    transaction: (callback: any) => Promise.resolve(callback({})),
  };
}

export const sql = getDatabaseConnection();
export const isDatabaseConnected = () => isConnected;



