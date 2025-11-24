import { Router } from 'express';
import { db } from '../db';
import { legalCases } from '../../shared/schema';
import { eq, sql, isNull, or, and } from 'drizzle-orm';

const router = Router();

/**
 * Datenqualitäts-Analyse für Rechtsprechungsdaten
 * GET /api/legal-cases/data-quality
 */
router.get('/data-quality', async (_req, res) => {
  try {
    // Zähle Gesamtfälle
    const totalCasesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(legalCases);
    const totalCases = totalCasesResult[0]?.count || 0;

    // Zähle fehlende Felder
    const missingFieldsResult = await db
      .select({
        missingSummary: sql<number>`count(*) FILTER (WHERE ${legalCases.summary} IS NULL)::int`,
        missingContent: sql<number>`count(*) FILTER (WHERE ${legalCases.content} IS NULL)::int`,
        missingVerdict: sql<number>`count(*) FILTER (WHERE ${legalCases.verdict} IS NULL)::int`,
        missingDamages: sql<number>`count(*) FILTER (WHERE ${legalCases.damages} IS NULL)::int`,
        missingDecisionDate: sql<number>`count(*) FILTER (WHERE ${legalCases.decisionDate} IS NULL)::int`,
      })
      .from(legalCases);

    const missing = missingFieldsResult[0];

    // Berechne Vollständigkeit
    const requiredFields = 5; // summary, content, verdict, damages, decisionDate
    const totalMissingFields =
      (missing?.missingSummary || 0) +
      (missing?.missingContent || 0) +
      (missing?.missingVerdict || 0) +
      (missing?.missingDamages || 0) +
      (missing?.missingDecisionDate || 0);

    const avgCompleteness = totalCases > 0
      ? ((totalCases * requiredFields - totalMissingFields) / (totalCases * requiredFields)) * 100
      : 100;

    const incompleteCases = totalCases - Math.floor((avgCompleteness / 100) * totalCases);
    const completeCases = totalCases - incompleteCases;

    res.json({
      totalCases,
      completeCases,
      incompleteCases,
      avgCompleteness,
      missingFields: {
        summary: missing?.missingSummary || 0,
        content: missing?.missingContent || 0,
        verdict: missing?.missingVerdict || 0,
        damages: missing?.missingDamages || 0,
        decisionDate: missing?.missingDecisionDate || 0,
      },
    });
  } catch (error: any) {
    console.error('[ERROR] Data quality analysis failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Hole unvollständige Fälle nach Jurisdiktion
 * GET /api/legal-cases/incomplete/:jurisdiction
 */
router.get('/incomplete/:jurisdiction', async (req, res) => {
  try {
    const { jurisdiction } = req.params;

    // WHERE-Bedingung für fehlende Felder
    const incompleteCriteria = or(
      isNull(legalCases.summary),
      isNull(legalCases.content),
      isNull(legalCases.verdict),
      isNull(legalCases.damages),
      isNull(legalCases.decisionDate)
    );

    // Baue Query mit optionalem Jurisdiktionsfilter
    let query = db
      .select()
      .from(legalCases)
      .where(
        jurisdiction && jurisdiction !== 'all'
          ? and(eq(legalCases.jurisdiction, jurisdiction), incompleteCriteria)
          : incompleteCriteria
      )
      .limit(50);

    const cases = await query;

    // Analysiere Vollständigkeit für jeden Fall
    const analyzed = cases.map((legalCase: any) => {
      const missingFields: string[] = [];
      if (!legalCase.summary) missingFields.push('Zusammenfassung');
      if (!legalCase.content) missingFields.push('Inhalt');
      if (!legalCase.verdict) missingFields.push('Urteil');
      if (!legalCase.damages) missingFields.push('Schadensersatz');
      if (!legalCase.decisionDate) missingFields.push('Entscheidungsdatum');

      const requiredFields = 5;
      const completeness = ((requiredFields - missingFields.length) / requiredFields) * 100;

      return {
        ...legalCase,
        missingFields,
        completeness,
      };
    });

    res.json(analyzed);
  } catch (error: any) {
    console.error('[ERROR] Incomplete cases fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fülle fehlende Daten eines einzelnen Falls aus
 * POST /api/legal-cases/:id/fill-missing-data
 */
router.post('/:id/fill-missing-data', async (req, res) => {
  try {
    const { id } = req.params;

    // Hole Fall
    const caseResults = await db
      .select()
      .from(legalCases)
      .where(eq(legalCases.id, id))
      .limit(1);

    if (!caseResults.length) {
      return res.status(404).json({ error: 'Fall nicht gefunden' });
    }

    const legalCase = caseResults[0];
    const updates: any = {};

    // Generiere fehlende Zusammenfassung aus content
    if (!legalCase.summary && legalCase.content) {
      updates.summary = legalCase.content.substring(0, 500) + '...';
    }

    // Generiere fehlende Inhalte aus summary
    if (!legalCase.content && legalCase.summary) {
      updates.content = `${legalCase.title}\n\n${legalCase.summary}\n\nGericht: ${legalCase.court}\nJurisdiktion: ${legalCase.jurisdiction}`;
    }

    // Generiere fehlendes Urteil aus summary/content
    if (!legalCase.verdict && (legalCase.summary || legalCase.content)) {
      const source = legalCase.summary || legalCase.content || '';
      // Extrahiere Urteilsrelevante Sätze
      const sentences = source.match(/[^.!?]+[.!?]+/g) || [];
      const verdictSentences = sentences.filter((s: string) =>
        /urteil|entschied|befand|stattgegeben|abgewiesen|verurteilt/i.test(s)
      );
      updates.verdict = verdictSentences.join(' ') || 'Urteil liegt vor (Details im Volltext)';
    }

    // Generiere fehlenden Schadensersatz aus content
    if (!legalCase.damages && (legalCase.summary || legalCase.content)) {
      const source = legalCase.summary || legalCase.content || '';
      // Suche nach Geldbeträgen
      const damagesMatch = source.match(/(\d[\d.,]*\s*(?:€|EUR|Dollar|\$|USD))/gi);
      if (damagesMatch) {
        updates.damages = `Schadensersatz: ${damagesMatch[0]}`;
      } else if (/schaden|ersatz|zahlung/i.test(source)) {
        updates.damages = 'Schadensersatz wurde zugesprochen (Betrag siehe Urteil)';
      }
    }

    // Aktualisiere Fall falls Updates vorhanden
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();

      await db
        .update(legalCases)
        .set(updates)
        .where(eq(legalCases.id, id));

      res.json({
        success: true,
        updated: Object.keys(updates),
        case: { ...legalCase, ...updates },
      });
    } else {
      res.json({
        success: true,
        message: 'Keine fehlenden Daten gefunden',
        case: legalCase,
      });
    }
  } catch (error: any) {
    console.error('[ERROR] Fill missing data failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Batch-Processing: Fülle alle unvollständigen Fälle aus
 * POST /api/legal-cases/fill-all-missing
 */
router.post('/fill-all-missing', async (req, res) => {
  try {
    const { jurisdiction } = req.body;

    // WHERE-Bedingung für fehlende Felder
    const incompleteCriteria = or(
      isNull(legalCases.summary),
      isNull(legalCases.content),
      isNull(legalCases.verdict),
      isNull(legalCases.damages)
    );

    // Hole unvollständige Fälle
    const query = db
      .select()
      .from(legalCases)
      .where(
        jurisdiction && jurisdiction !== 'all'
          ? and(eq(legalCases.jurisdiction, jurisdiction), incompleteCriteria)
          : incompleteCriteria
      );

    const cases = await query;

    let updatedCount = 0;
    const errors: string[] = [];

    // Verarbeite jeden Fall
    for (const legalCase of cases) {
      try {
        const updates: any = {};

        // Logik wie in fill-missing-data
        if (!legalCase.summary && legalCase.content) {
          updates.summary = legalCase.content.substring(0, 500) + '...';
        }

        if (!legalCase.content && legalCase.summary) {
          updates.content = `${legalCase.title}\n\n${legalCase.summary}\n\nGericht: ${legalCase.court}\nJurisdiktion: ${legalCase.jurisdiction}`;
        }

        if (!legalCase.verdict && (legalCase.summary || legalCase.content)) {
          const source = legalCase.summary || legalCase.content || '';
          const sentences = source.match(/[^.!?]+[.!?]+/g) || [];
          const verdictSentences = sentences.filter((s: string) =>
            /urteil|entschied|befand|stattgegeben|abgewiesen|verurteilt/i.test(s)
          );
          updates.verdict = verdictSentences.join(' ') || 'Urteil liegt vor (Details im Volltext)';
        }

        if (!legalCase.damages && (legalCase.summary || legalCase.content)) {
          const source = legalCase.summary || legalCase.content || '';
          const damagesMatch = source.match(/(\d[\d.,]*\s*(?:€|EUR|Dollar|\$|USD))/gi);
          if (damagesMatch) {
            updates.damages = `Schadensersatz: ${damagesMatch[0]}`;
          } else if (/schaden|ersatz|zahlung/i.test(source)) {
            updates.damages = 'Schadensersatz wurde zugesprochen (Betrag siehe Urteil)';
          }
        }

        // Aktualisiere falls Updates vorhanden
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date();
          await db
            .update(legalCases)
            .set(updates)
            .where(eq(legalCases.id, legalCase.id));
          updatedCount++;
        }
      } catch (error: any) {
        errors.push(`Fall ${legalCase.id}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      totalProcessed: cases.length,
      updated: updatedCount,
      skipped: cases.length - updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[ERROR] Batch fill failed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
