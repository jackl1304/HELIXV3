import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

/**
 * Notes API für FloatingNotes Widget
 *
 * Speichert Benutzer-Notizen mit Kontext (Projekt/Produkt)
 * für persistente Session-übergreifende Speicherung
 */

// Erstelle Tabelle falls nicht vorhanden
async function ensureNotesTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_notes (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      context VARCHAR NOT NULL,
      content TEXT NOT NULL,
      page_title VARCHAR,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_user_notes_context ON user_notes(context)
  `);
}

// Initialisiere Tabelle
ensureNotesTable().catch(console.error);

/**
 * GET /api/notes/:context
 * Hole Notizen für einen Kontext
 */
router.get('/:context', async (req, res) => {
  try {
    const { context } = req.params;

    const result = await db.execute(sql`
      SELECT * FROM user_notes
      WHERE context = ${context}
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({ content: '', lastSaved: null });
    }

    const note = result.rows[0] as any;
    res.json({
      id: note.id,
      context: note.context,
      content: note.content,
      pageTitle: note.page_title,
      metadata: note.metadata,
      lastSaved: note.updated_at,
    });
  } catch (error: any) {
    console.error('[ERROR] Notes fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notes
 * Speichere oder update Notizen
 */
router.post('/', async (req, res) => {
  try {
    const { context, content, pageTitle, metadata } = req.body;

    if (!context || !content) {
      return res.status(400).json({ error: 'Context und Content erforderlich' });
    }

    // Prüfe ob Notiz existiert
    const existing = await db.execute(sql`
      SELECT id FROM user_notes WHERE context = ${context} LIMIT 1
    `);

    if (existing.rows.length > 0) {
      // Update
      await db.execute(sql`
        UPDATE user_notes
        SET
          content = ${content},
          page_title = ${pageTitle || null},
          metadata = ${metadata ? JSON.stringify(metadata) : null}::jsonb,
          updated_at = NOW()
        WHERE context = ${context}
      `);
    } else {
      // Insert
      await db.execute(sql`
        INSERT INTO user_notes (context, content, page_title, metadata)
        VALUES (
          ${context},
          ${content},
          ${pageTitle || null},
          ${metadata ? JSON.stringify(metadata) : null}::jsonb
        )
      `);
    }

    res.json({ success: true, context });
  } catch (error: any) {
    console.error('[ERROR] Notes save failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/notes/:context
 * Lösche Notizen für einen Kontext
 */
router.delete('/:context', async (req, res) => {
  try {
    const { context } = req.params;

    await db.execute(sql`
      DELETE FROM user_notes WHERE context = ${context}
    `);

    res.json({ success: true });
  } catch (error: any) {
    console.error('[ERROR] Notes delete failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notes
 * Hole alle Notizen (für Übersicht)
 */
router.get('/', async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT
        context,
        page_title,
        LENGTH(content) as content_length,
        updated_at
      FROM user_notes
      ORDER BY updated_at DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error: any) {
    console.error('[ERROR] Notes list failed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
