import { Router, Request, Response } from "express";
import { 
  generateAllEmbeddings, 
  generateEmbeddingForUpdate,
  getEmbeddingStats 
} from "../services/embeddingsService";

// Simple console logger
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
};

const router = Router();

/**
 * POST /api/embeddings/generate
 * Generate embeddings for all regulatory updates without embeddings
 */
router.post("/generate", async (req: Request, res: Response) => {
  try {
    logger.info("Starting embeddings generation for all updates");

    const stats = await generateAllEmbeddings();

    res.json({
      success: true,
      message: "Embeddings generation completed",
      stats,
    });
  } catch (error: any) {
    logger.error("Failed to generate embeddings", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/embeddings/generate/:id
 * Generate embedding for a single regulatory update
 */
router.post("/generate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await generateEmbeddingForUpdate(id);

    res.json({
      success: true,
      message: `Embedding generated for update ${id}`,
    });
  } catch (error: any) {
    logger.error(`Failed to generate embedding for update ${req.params.id}`, {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/embeddings/stats
 * Get statistics about embeddings coverage
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await getEmbeddingStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    logger.error("Failed to get embedding stats", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
