import OpenAI from "openai";
import { db } from "../db";
import { regulatoryUpdates } from "../../shared/schema";
import { eq, isNull, sql } from "drizzle-orm";

// Simple console logger
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data || ''),
};

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// However, for embeddings we use text-embedding-3-small (1536 dimensions)
// Windows-kompatible OpenAI/OpenRouter-Initialisierung mit Fallback
let openai: OpenAI | null = null;
try {
  // Unterstützt sowohl OpenAI als auch OpenRouter
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    // Prüfe ob es ein OpenRouter Key ist (beginnt mit sk-or-v1-)
    const isOpenRouter = apiKey.startsWith('sk-or-v1-');
    openai = new OpenAI({ 
      apiKey: apiKey,
      baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined
    });
    if (isOpenRouter) {
      console.log('[EMBEDDINGS] Using OpenRouter API');
    } else {
      console.log('[EMBEDDINGS] Using OpenAI API');
    }
  } else {
    console.warn('[EMBEDDINGS] OPENAI_API_KEY or OPENROUTER_API_KEY not set, embeddings will be disabled');
  }
} catch (error) {
  console.warn('[EMBEDDINGS] Failed to initialize OpenAI/OpenRouter, embeddings will be disabled:', error);
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 10; // Process 10 updates at a time (sequential, not parallel)
const REQUEST_DELAY_MS = 1200; // 1.2s delay between requests = ~50 RPM (safe for 3k RPM limit)

interface EmbeddingStats {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Generate embedding text from regulatory update
 * Combines title, description, and content for comprehensive semantic representation
 */
function generateEmbeddingText(update: any): string {
  const parts: string[] = [];
  
  if (update.title) parts.push(`Title: ${update.title}`);
  if (update.description) parts.push(`Description: ${update.description}`);
  if (update.content) parts.push(`Content: ${update.content}`);
  if (update.category) parts.push(`Category: ${update.category}`);
  if (update.deviceType) parts.push(`Device Type: ${update.deviceType}`);
  if (update.therapeuticArea) parts.push(`Therapeutic Area: ${update.therapeuticArea}`);
  if (update.jurisdiction) parts.push(`Jurisdiction: ${update.jurisdiction}`);
  
  return parts.join("\n\n").trim();
}

/**
 * Generate embedding for a single text using OpenAI API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: "float",
    });
    
    return response.data[0].embedding;
  } catch (error: any) {
    logger.error("Failed to generate embedding", {
      error: error.message,
      textLength: text.length,
    });
    throw error;
  }
}

/**
 * Process embeddings for all regulatory updates that don't have embeddings yet
 */
export async function generateAllEmbeddings(): Promise<EmbeddingStats> {
  const stats: EmbeddingStats = {
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    // Get all updates without embeddings
    const updatesWithoutEmbeddings = await db
      .select()
      .from(regulatoryUpdates)
      .where(isNull(regulatoryUpdates.embedding));

    logger.info(`Found ${updatesWithoutEmbeddings.length} updates without embeddings`);

    if (updatesWithoutEmbeddings.length === 0) {
      logger.info("All updates already have embeddings");
      return stats;
    }

    // Process SEQUENTIALLY to respect OpenAI rate limits (3,000 RPM)
    // Running 50 requests/min = ~3,000 requests/hour is safe
    for (let i = 0; i < updatesWithoutEmbeddings.length; i++) {
      const update = updatesWithoutEmbeddings[i];
      
      // Log progress every 10 updates
      if (i % 10 === 0) {
        logger.info(`Processing update ${i + 1}/${updatesWithoutEmbeddings.length} (${Math.round((i / updatesWithoutEmbeddings.length) * 100)}%)`);
      }

      try {
        // Skip if no content
        if (!update.title && !update.description && !update.content) {
          stats.skippedCount++;
          logger.warn(`Skipping update ${update.id} - no content to embed`);
          stats.totalProcessed++;
          continue;
        }

        // Generate embedding text
        const embeddingText = generateEmbeddingText(update);
        
        // Generate embedding with retry logic for 429 errors
        let embedding: number[] | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries && !embedding) {
          try {
            embedding = await generateEmbedding(embeddingText);
          } catch (error: any) {
            if (error.message.includes('429') && retryCount < maxRetries - 1) {
              // Exponential backoff for rate limit errors
              const backoffDelay = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s
              logger.warn(`Rate limit hit, retrying in ${backoffDelay/1000}s... (attempt ${retryCount + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
              retryCount++;
            } else {
              throw error; // Give up or different error
            }
          }
        }

        if (!embedding) {
          throw new Error("Failed to generate embedding after retries");
        }

        // Update database with embedding
        await db
          .update(regulatoryUpdates)
          .set({ 
            embedding: embedding as any,
            updatedAt: new Date() 
          })
          .where(eq(regulatoryUpdates.id, update.id));

        stats.successCount++;
      } catch (error: any) {
        stats.errorCount++;
        
        // Distinguish quota vs rate limit errors
        const isQuotaError = error.message.includes('429') && error.message.includes('quota');
        const errorType = isQuotaError ? 'QUOTA_EXHAUSTED' : 'ERROR';
        
        stats.errors.push({
          id: update.id,
          error: `[${errorType}] ${error.message}`,
        });
        
        logger.error(`Failed to generate embedding for update ${update.id}`, {
          error: error.message,
          type: errorType,
        });
        
        // Stop immediately if quota is exhausted (no point retrying)
        if (isQuotaError) {
          logger.error("OpenAI quota exhausted - stopping embedding generation");
          stats.totalProcessed = i + 1;
          return stats;
        }
      }

      stats.totalProcessed++;

      // Delay between requests to respect rate limits (~50 RPM)
      if (i < updatesWithoutEmbeddings.length - 1) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
      }
    }

    logger.info("Embedding generation completed", {
      totalProcessed: stats.totalProcessed,
      successCount: stats.successCount,
      errorCount: stats.errorCount,
      skippedCount: stats.skippedCount,
    });

    return stats;
  } catch (error: any) {
    logger.error("Failed to generate embeddings", { error: error.message });
    throw error;
  }
}

/**
 * Generate embedding for a single regulatory update by ID
 */
export async function generateEmbeddingForUpdate(updateId: string): Promise<void> {
  try {
    const [update] = await db
      .select()
      .from(regulatoryUpdates)
      .where(eq(regulatoryUpdates.id, updateId));

    if (!update) {
      throw new Error(`Update not found: ${updateId}`);
    }

    // Generate embedding text
    const embeddingText = generateEmbeddingText(update);
    
    if (!embeddingText) {
      throw new Error("No content to embed");
    }

    // Generate embedding
    const embedding = await generateEmbedding(embeddingText);

    // Update database
    await db
      .update(regulatoryUpdates)
      .set({ 
        embedding: embedding as any,
        updatedAt: new Date() 
      })
      .where(eq(regulatoryUpdates.id, updateId));

    logger.info(`Generated embedding for update ${updateId}`);
  } catch (error: any) {
    logger.error(`Failed to generate embedding for update ${updateId}`, {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Generate embedding for a query text (for semantic search)
 */
export async function generateQueryEmbedding(queryText: string): Promise<number[]> {
  try {
    return await generateEmbedding(queryText);
  } catch (error: any) {
    logger.error("Failed to generate query embedding", {
      error: error.message,
      queryText,
    });
    throw error;
  }
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats() {
  try {
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(regulatoryUpdates);

    const [embeddedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(regulatoryUpdates)
      .where(sql`${regulatoryUpdates.embedding} IS NOT NULL`);

    const [missingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(regulatoryUpdates)
      .where(isNull(regulatoryUpdates.embedding));

    return {
      total: Number(totalCount.count),
      embedded: Number(embeddedCount.count),
      missing: Number(missingCount.count),
      percentage: totalCount.count > 0 
        ? Math.round((Number(embeddedCount.count) / Number(totalCount.count)) * 100) 
        : 0,
    };
  } catch (error: any) {
    logger.error("Failed to get embedding stats", { error: error.message });
    throw error;
  }
}
