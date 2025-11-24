import { Router } from 'express';
import { db } from '../db';

const router = Router();

/**
 * Debug-Route um Customer Portal Status zu überprüfen
 * GET /api/debug/customer-access
 */
router.get('/customer-access', async (_req, res) => {
  try {
    // Prüfe Tenants
    const tenants = await db.query(`
      SELECT id, name, subdomain, is_active,
             settings->'permissions' as permissions
      FROM tenants
      WHERE is_active = true
      LIMIT 5
    `);

    // Prüfe Customer Routes
    const routes = [
      '/customer/dashboard',
      '/customer/regulatory-updates',
      '/customer/legal-cases',
      '/customer/analytics',
      '/customer/ai-insights',
      '/customer/newsletters',
      '/customer/global-sources',
      '/customer/data-collection',
      '/customer/historical-data',
      '/customer/knowledge-base',
      '/customer/settings'
    ];

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      tenants: {
        count: tenants.rows.length,
        active: tenants.rows.map((t: any) => ({
          id: t.id,
          name: t.name,
          subdomain: t.subdomain,
          hasPermissions: !!t.permissions
        }))
      },
      routes: {
        registered: routes,
        count: routes.length
      },
      recommendations: [
        {
          issue: 'Tenant Auswahl',
          fix: 'Nutze Tenant ID: ' + (tenants.rows[0]?.id || 'Keine Tenants gefunden'),
          url: `/customer/dashboard?tenant=${tenants.rows[0]?.id || ''}`
        },
        {
          issue: 'Direct Access',
          fix: 'Direkt zum Customer Dashboard navigieren',
          url: '/customer/dashboard'
        },
        {
          issue: 'Auth Flow',
          fix: 'Überprüfe customer-router.tsx loadCustomerData()',
          file: 'client/src/components/customer/customer-router.tsx'
        }
      ]
    });
  } catch (error: any) {
    console.error('[DEBUG] Customer access check error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Debug-Route um alle Rechtsprechungsdaten zu analysieren
 * GET /api/debug/rechtsprechung-analysis
 */
router.get('/rechtsprechung-analysis', async (_req, res) => {
  try {
    // Prüfe ob Rechtsprechungs-Tabelle existiert
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'legal_cases'
      ) as exists
    `);

    if (!tableCheck.rows[0]?.exists) {
      return res.json({
        status: 'TABLE_NOT_FOUND',
        message: 'Tabelle legal_cases existiert nicht',
        recommendation: 'Migration für Rechtsprechungsdaten erforderlich'
      });
    }

    // Hole alle Spalten
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'legal_cases'
      ORDER BY ordinal_position
    `);

    // Hole Beispiel-Daten
    const samples = await db.query(`
      SELECT * FROM legal_cases LIMIT 5
    `);

    // Analysiere Datenqualität
    const analysis = await db.query(`
      SELECT
        COUNT(*) as total_cases,
        COUNT(DISTINCT court) as unique_courts,
        COUNT(DISTINCT case_number) as unique_case_numbers,
        COUNT(title) as has_title,
        COUNT(summary) as has_summary,
        COUNT(full_text) as has_full_text,
        COUNT(published_at) as has_published_date,
        COUNT(relevance_score) as has_relevance_score,
        AVG(relevance_score) as avg_relevance_score
      FROM legal_cases
    `);

    // Finde NULL/fehlende Werte
    const nullAnalysis = await db.query(`
      SELECT
        id,
        case_number,
        CASE WHEN title IS NULL THEN true ELSE false END as missing_title,
        CASE WHEN summary IS NULL THEN true ELSE false END as missing_summary,
        CASE WHEN full_text IS NULL THEN true ELSE false END as missing_full_text,
        CASE WHEN published_at IS NULL THEN true ELSE false END as missing_date,
        CASE WHEN relevance_score IS NULL THEN true ELSE false END as missing_score
      FROM legal_cases
      WHERE title IS NULL
         OR summary IS NULL
         OR full_text IS NULL
         OR published_at IS NULL
         OR relevance_score IS NULL
      LIMIT 20
    `);

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      schema: {
        columns: columns.rows,
        count: columns.rows.length
      },
      dataQuality: analysis.rows[0],
      samples: samples.rows,
      missingData: {
        count: nullAnalysis.rows.length,
        cases: nullAnalysis.rows
      },
      recommendations: [
        {
          action: 'Fehlende Titel ergänzen',
          sql: `UPDATE legal_cases SET title = 'Rechtsprechung ' || case_number WHERE title IS NULL`
        },
        {
          action: 'Zusammenfassungen generieren',
          method: 'Aus full_text erste 500 Zeichen extrahieren'
        },
        {
          action: 'Relevanz-Scores berechnen',
          method: 'Basierend auf Aktualität und Zitierungen'
        }
      ]
    });

  } catch (error: any) {
    console.error('[DEBUG] Rechtsprechung analysis error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;
