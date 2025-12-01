/**
 * Patents API Routes
 * Endpoints for searching, filtering, and retrieving patent data
 */

import { Router, Request, Response } from 'express';
import { db } from '../storage';
import { patents } from '../../shared/schema.js';
import { sql } from 'drizzle-orm';
import { Logger } from '../services/logger.service';

const router = Router();
const logger = new Logger('PatentsAPI');

/**
 * GET /api/patents
 * List all patents with pagination
 * FIXED: Using native PG driver with proper connection pooling
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    // Use Drizzle ORM (now backed by native PG pool)
    const [patentsList, totalResult] = await Promise.all([
      db.select().from(patents)
        .orderBy(sql`${patents.publicationDate} DESC NULLS LAST`)
        .limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)::int` }).from(patents)
    ]);

    const total = totalResult[0]?.count || 0;

    res.json({
      data: patentsList,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    logger.error('Error fetching patents:', { error: error.message });
    // Graceful degradation
    res.json({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 }
    });
  }
});



/**
 * GET /api/patents/v1/all
 * Gibt alle Patente (max. 500) für Legacy-/Kompatibilitätszwecke zurück
 */
router.get('/v1/all', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(500, parseInt(req.query.limit as string) || 100);
    const patentsList = await db.select().from(patents)
      .orderBy(sql`${patents.publicationDate} DESC NULLS LAST`)
      .limit(limit);
    res.json({ data: patentsList, count: patentsList.length });
  } catch (error: any) {
    logger.error('Error fetching all patents (v1/all):', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch all patents' });
  }
});

/**
 * GET /api/patents/:id
 * Get patent by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const patent = await db
      .select()
      .from(patents)
      .where(sql`${patents.id} = ${id}`)
      .limit(1);

    if (!patent.length) {
      return res.status(404).json({ error: 'Patent not found' });
    }

    res.json(patent[0]);
  } catch (error: any) {
    logger.error('Error fetching patent:', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch patent' });
  }
});

/**
 * GET /api/patents/stats/overview
 * Get patent statistics
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(patents),
      db
        .select({
          jurisdiction: patents.jurisdiction,
          count: sql<number>`COUNT(*)`
        })
        .from(patents)
        .groupBy(patents.jurisdiction),
      db
        .select({
          status: patents.status,
          count: sql<number>`COUNT(*)`
        })
        .from(patents)
        .groupBy(patents.status),
      db
        .select({
          source: patents.source,
          count: sql<number>`COUNT(*)`
        })
        .from(patents)
        .groupBy(patents.source),
      db
        .select({
          deviceType: patents.deviceType,
          count: sql<number>`COUNT(*)`
        })
        .from(patents)
        .where(sql`${patents.deviceType} IS NOT NULL`)
        .groupBy(patents.deviceType)
        .limit(10),
      db
        .select({
          therapeuticArea: patents.therapeuticArea,
          count: sql<number>`COUNT(*)`
        })
        .from(patents)
        .where(sql`${patents.therapeuticArea} IS NOT NULL`)
        .groupBy(patents.therapeuticArea)
        .limit(10)
    ]);

    res.json({
      totalPatents: stats[0][0]?.count || 0,
      byJurisdiction: stats[1],
      byStatus: stats[2],
      bySource: stats[3],
      topDeviceTypes: stats[4],
      topTherapeuticAreas: stats[5]
    });
  } catch (error: any) {
    logger.error('Error fetching patent stats:', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/patents/jurisdiction/:jurisdiction
 * Get patents by jurisdiction
 */
router.get('/jurisdiction/:jurisdiction', async (req: Request, res: Response) => {
  try {
    const { jurisdiction } = req.params;
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

    const patentsList = await db
      .select()
      .from(patents)
      .where(sql`${patents.jurisdiction} = ${jurisdiction}`)
      .orderBy(sql`${patents.publicationDate} DESC`)
      .limit(limit);

    res.json({
      jurisdiction,
      count: patentsList.length,
      data: patentsList
    });
  } catch (error: any) {
    logger.error('Error fetching patents by jurisdiction:', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch patents' });
  }
});

/**
 * GET /api/patents/source/:source
 * Get patents by source
 */
router.get('/source/:source', async (req: Request, res: Response) => {
  try {
    const { source } = req.params;
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

    const patentsList = await db
      .select()
      .from(patents)
      .where(sql`${patents.source} = ${source}`)
      .orderBy(sql`${patents.publicationDate} DESC`)
      .limit(limit);

    res.json({
      source,
      count: patentsList.length,
      data: patentsList
    });
  } catch (error: any) {
    logger.error('Error fetching patents by source:', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch patents' });
  }
});

export default router;
