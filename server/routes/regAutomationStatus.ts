import { Router } from 'express';
import { regAutomationRunStats, REG_SOURCES } from '../services/regulatoryUpdateCollector';
import { db } from '../storage';

const router = Router();

router.get('/api/reg-automation/status', async (_req, res) => {
  try {
    // Aggregate counts by source_id
    let counts: Record<string, number> = {};
    try {
      const result = await (db as any).execute({
        sql: 'SELECT source_id, COUNT(*)::int AS cnt FROM regulatory_updates GROUP BY source_id',
        params: []
      });
      if (Array.isArray(result)) {
        for (const row of result) {
          if (row.source_id) counts[row.source_id] = row.cnt;
        }
      }
    } catch (e: any) {
      console.warn('[REG] Status count query failed:', e.message);
    }

    // Map sources with counts
    const sourceStatus = REG_SOURCES.map(s => ({
      id: s.id,
      name: s.name,
      enabled: s.enabled !== false,
      type: s.type,
      region: s.region,
      count: counts[s.id] || 0,
    }));

    res.json({
      run: regAutomationRunStats,
      sources: sourceStatus,
      embedEnabled: process.env.REG_EMBED_ENABLED === 'true'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
