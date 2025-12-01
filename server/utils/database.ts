import { Pool, PoolConfig } from 'pg';
import { logger } from '../services/logger.service.js';

/**
 * Database connection and optimization utilities
 * Provides connection pooling, health checks, and performance monitoring
 */

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | object;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class DatabaseManager {
  private pool: Pool | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries = 5;

  /**
   * Initialize database connection pool
   */
  async initialize(config: DatabaseConfig): Promise<void> {
    try {
      const poolConfig: PoolConfig = {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl,
        max: config.max || 20,
        idleTimeoutMillis: config.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
        // Connection validation
        allowExitOnIdle: true,
        keepAlive: true,
        keepAliveInitialDelayMillis: 0
      };

      this.pool = new Pool(poolConfig);

      // Event handlers
      this.pool.on('connect', (client) => {
        logger.debug('New database client connected');
      });

      this.pool.on('error', (err, client) => {
        logger.error('Unexpected database error', {
          error: err.message,
          code: err.code,
          severity: err.severity
        });
      });

      this.pool.on('remove', (client) => {
        logger.debug('Database client removed from pool');
      });

      // Test connection
      await this.testConnection();
      this.isConnected = true;

      logger.info('Database connection pool initialized', {
        host: config.host,
        database: config.database,
        maxConnections: config.max
      });

    } catch (error: any) {
      this.connectionAttempts++;
      logger.error('Failed to initialize database connection', {
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries,
        error: error.message
      });

      if (this.connectionAttempts < this.maxRetries) {
        logger.info('Retrying database connection...', { delay: 2000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.initialize(config);
      }

      throw new Error(`Database initialization failed after ${this.maxRetries} attempts: ${error.message}`);
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('SELECT NOW()');
      logger.debug('Database connection test successful');
    } finally {
      client.release();
    }
  }

  /**
   * Get database client from pool
   */
  async getClient() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    return await this.pool.connect();
  }

  /**
   * Execute query with automatic client management
   */
  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const startTime = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        logger.warn('Slow database query detected', {
          duration,
          query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          rowCount: result.rowCount
        });
      }

      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Execute transaction
   */
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get connection pool statistics
   */
  getStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      connected: this.isConnected,
      lastTest: new Date().toISOString()
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency?: number;
    stats?: any;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      await this.testConnection();
      const latency = Date.now() - startTime;

      return {
        healthy: true,
        latency,
        stats: this.getStats()
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Gracefully close all connections
   */
  async close(): Promise<void> {
    if (this.pool) {
      logger.info('Closing database connection pool...');
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database connection pool closed');
    }
  }
}

// Export singleton instance
export const dbManager = new DatabaseManager();

/**
 * Initialize database from environment variables
 */
export async function initializeDatabase(): Promise<void> {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'helix',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000')
  };

  await dbManager.initialize(config);
}

/**
 * Query builder utilities for common patterns
 */
export class QueryBuilder {
  private table: string;
  private selectFields: string[] = ['*'];
  private whereConditions: string[] = [];
  private whereParams: any[] = [];
  private orderBy: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string | string[]): this {
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  where(condition: string, params?: any[]): this {
    this.whereConditions.push(condition);
    if (params) {
      this.whereParams.push(...params);
    }
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderBy.push(`${field} ${direction}`);
    return this;
  }

  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  offset(offset: number): this {
    this.offsetValue = offset;
    return this;
  }

  async execute(): Promise<any> {
    let query = `SELECT ${this.selectFields.join(', ')} FROM ${this.table}`;

    if (this.whereConditions.length > 0) {
      query += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    if (this.orderBy.length > 0) {
      query += ` ORDER BY ${this.orderBy.join(', ')}`;
    }

    if (this.limitValue !== undefined) {
      query += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== undefined) {
      query += ` OFFSET ${this.offsetValue}`;
    }

    return await dbManager.query(query, this.whereParams);
  }
}

/**
 * Create a query builder for a table
 */
export function from(table: string): QueryBuilder {
  return new QueryBuilder(table);
}
