import type { Express } from "express";
import { aiAssistant, type AIAssistantContext } from '../services/aiAssistantService.js';
import { storage } from '../storage.js';

/**
 * KI-Assistent API Routes
 * Vollständige KI-Funktionalität für Helix
 */
export function registerAIRoutes(app: Express) {
  // KI-Chat-Endpunkt
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { query, context } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query parameter required' });
      }

      // Kontext setzen
      if (context) {
        aiAssistant.setContext(context as AIAssistantContext);
      }

      // Query verarbeiten
      const response = await aiAssistant.processQuery(query);

      res.json({
        success: true,
        response,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[AI API] Chat error:', error);
      res.status(500).json({
        error: 'AI processing failed',
        message: error.message
      });
    }
  });

  // KI-Kontext setzen
  app.post('/api/ai/context', async (req, res) => {
    try {
      const { context } = req.body;

      if (!context) {
        return res.status(400).json({ error: 'Context parameter required' });
      }

      aiAssistant.setContext(context as AIAssistantContext);

      res.json({
        success: true,
        message: 'Context updated',
        context
      });
    } catch (error: any) {
      console.error('[AI API] Context error:', error);
      res.status(500).json({
        error: 'Context update failed',
        message: error.message
      });
    }
  });

  // Dokument generieren
  app.post('/api/ai/generate-document', async (req, res) => {
    try {
      const { template, data } = req.body;

      if (!template || !data) {
        return res.status(400).json({ error: 'Template and data parameters required' });
      }

      const document = await aiAssistant.generateDocument(template, data);

      res.json({
        success: true,
        document,
        template,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[AI API] Document generation error:', error);
      res.status(500).json({
        error: 'Document generation failed',
        message: error.message
      });
    }
  });

  // Externe Suche (mit Benutzererlaubnis)
  app.post('/api/ai/search-external', async (req, res) => {
    try {
      const { query, context, permissionGranted } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query parameter required' });
      }

      if (!permissionGranted) {
        return res.status(403).json({
          error: 'External search permission required',
          message: 'Benutzer muss externe Suche erlauben'
        });
      }

      const response = await aiAssistant.searchExternal(query, context);

      res.json({
        success: true,
        response,
        type: 'external_search',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[AI API] External search error:', error);
      res.status(500).json({
        error: 'External search failed',
        message: error.message
      });
    }
  });

  // KI-Insights für Dashboard
  app.get('/api/ai/insights', async (req, res) => {
    try {
      const { category, limit = 5 } = req.query;

      // Sammle Daten aus verschiedenen Quellen
      const insights = await generateAIInsights(category as string, parseInt(limit as string));

      res.json({
        success: true,
        insights,
        category: category || 'general',
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[AI API] Insights error:', error);
      res.status(500).json({
        error: 'Insights generation failed',
        message: error.message
      });
    }
  });

  // KI-gestützte Compliance-Prüfung
  app.post('/api/ai/compliance-check', async (req, res) => {
    try {
      const { deviceType, region, requirements } = req.body;

      if (!deviceType || !region) {
        return res.status(400).json({ error: 'deviceType and region parameters required' });
      }

      const complianceReport = await generateComplianceReport(deviceType, region, requirements);

      res.json({
        success: true,
        report: complianceReport,
        deviceType,
        region,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[AI API] Compliance check error:', error);
      res.status(500).json({
        error: 'Compliance check failed',
        message: error.message
      });
    }
  });

  // Projekt-Intelligenz (Bereich 3)
  app.post('/api/ai/project-intelligence', async (req, res) => {
    try {
      const { projectData, regulatoryPathway } = req.body;

      if (!projectData) {
        return res.status(400).json({ error: 'projectData parameter required' });
      }

      const intelligence = await generateProjectIntelligence(projectData, regulatoryPathway);

      res.json({
        success: true,
        intelligence,
        projectId: projectData.id,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[AI API] Project intelligence error:', error);
      res.status(500).json({
        error: 'Project intelligence failed',
        message: error.message
      });
    }
  });

  // Dokumenten-Analyse
  app.post('/api/ai/analyze-document', async (req, res) => {
    try {
      const { documentId, documentContent, analysisType } = req.body;

      if (!documentContent) {
        return res.status(400).json({ error: 'documentContent parameter required' });
      }

      const analysis = await analyzeDocument(documentContent, analysisType);

      res.json({
        success: true,
        analysis,
        documentId,
        analysisType,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[AI API] Document analysis error:', error);
      res.status(500).json({
        error: 'Document analysis failed',
        message: error.message
      });
    }
  });
}

/**
 * Generiert KI-Insights für Dashboard
 */
async function generateAIInsights(category?: string, limit: number = 5) {
  try {
    // Sammle Daten aus verschiedenen Quellen
    const updates = await storage.getRecentRegulatoryUpdates(20);
    const projects = await storage.getAllProjects();
    const patents = await storage.getAllPatents(10);

    const insights = [];

    // Regulatorische Trends
    if (!category || category === 'regulatory') {
      const recentUpdates = updates.filter(u => {
        const date = new Date(u.published_date || u.created_at);
        const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      });

      if (recentUpdates.length > 0) {
        insights.push({
          id: 'regulatory_trends',
          type: 'trend',
          title: 'Regulatorische Entwicklungen',
          description: `${recentUpdates.length} neue regulatorische Updates in den letzten 30 Tagen`,
          priority: 'high',
          data: recentUpdates.slice(0, 3),
          recommendations: [
            'Überprüfen Sie Compliance-Anforderungen',
            'Aktualisieren Sie Qualitätsmanagementsysteme',
            'Planen Sie Schulungen für Mitarbeiter'
          ]
        });
      }
    }

    // Projekt-Risiken
    if (!category || category === 'projects') {
      const highRiskProjects = projects.filter(p => p.risk_level === 'high' || p.priority >= 4);

      if (highRiskProjects.length > 0) {
        insights.push({
          id: 'project_risks',
          type: 'risk',
          title: 'Projekt-Risiken identifiziert',
          description: `${highRiskProjects.length} Projekte mit hohem Risiko oder Priorität`,
          priority: 'critical',
          data: highRiskProjects.slice(0, 3),
          recommendations: [
            'Erhöhte Überwachung implementieren',
            'Zusätzliche Ressourcen zuweisen',
            'Regulatorische Beratung hinzuziehen'
          ]
        });
      }
    }

    // Patent-Entwicklungen
    if (!category || category === 'patents') {
      const recentPatents = patents.filter(p => {
        const date = new Date(p.publication_date || p.created_at);
        const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 90;
      });

      if (recentPatents.length > 0) {
        insights.push({
          id: 'patent_developments',
          type: 'innovation',
          title: 'Neue Patent-Entwicklungen',
          description: `${recentPatents.length} relevante Patente in den letzten 90 Tagen`,
          priority: 'medium',
          data: recentPatents.slice(0, 3),
          recommendations: [
            'Freedom-to-Operate-Analyse durchführen',
            'Wettbewerbsbeobachtung intensivieren',
            'Lizenzierungsoptionen prüfen'
          ]
        });
      }
    }

    return insights.slice(0, limit);
  } catch (error) {
    console.error('[AI] Insights generation error:', error);
    return [];
  }
}

/**
 * Generiert Compliance-Bericht
 */
async function generateComplianceReport(deviceType: string, region: string, requirements?: any) {
  try {
    // Sammle relevante regulatorische Updates
    const updates = await storage.getAllRegulatoryUpdates();
    const relevantUpdates = updates.filter(u =>
      u.jurisdiction === region &&
      (u.device_type === deviceType || !u.device_type)
    );

    // Sammle relevante Rechtsfälle
    const legalCases = await storage.getAllLegalCases();
    const relevantCases = legalCases.filter(lc =>
      lc.jurisdiction === region
    );

    return {
      deviceType,
      region,
      complianceStatus: relevantUpdates.length > 0 ? 'requires_review' : 'compliant',
      relevantUpdates: relevantUpdates.slice(0, 10),
      relevantLegalCases: relevantCases.slice(0, 5),
      recommendations: [
        'Regelmäßige Compliance-Überprüfungen durchführen',
        'Dokumentation aktualisieren',
        'Schulungen für relevante Teams',
        'Audits planen und durchführen'
      ],
      riskLevel: relevantUpdates.length > 5 ? 'high' : 'medium',
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error('[AI] Compliance report error:', error);
    throw error;
  }
}

/**
 * Generiert Projekt-Intelligenz
 */
async function generateProjectIntelligence(projectData: any, regulatoryPathway?: any) {
  try {
    // Sammle relevante Daten
    const similarProjects = await storage.getAllProjects();
    const relevantPatents = await storage.getAllPatents(20);
    const regulatoryUpdates = await storage.getRecentRegulatoryUpdates(15);

    return {
      projectId: projectData.id,
      riskAssessment: {
        level: projectData.risk_level || 'medium',
        factors: [
          'Regulatorische Komplexität',
          'Technische Herausforderungen',
          'Marktzugang',
          'Wettbewerbssituation'
        ]
      },
      timelineAnalysis: {
        estimated: projectData.estimated_approval_date,
        similarProjects: similarProjects.filter(p =>
          p.device_type === projectData.device_type
        ).length,
        bottlenecks: ['Klinische Prüfungen', 'Dokumentation', 'Zulassungsprozess']
      },
      competitiveAnalysis: {
        relevantPatents: relevantPatents.filter(p =>
          p.therapeutic_area === projectData.therapeutic_area
        ).slice(0, 5),
        marketTrends: regulatoryUpdates.filter(u =>
          u.category === projectData.device_type
        ).slice(0, 3)
      },
      recommendations: [
        'Regulatorischen Pathway frühzeitig festlegen',
        'Klinische Strategie entwickeln',
        'Qualitätsmanagement implementieren',
        'Risikomanagement etablieren'
      ]
    };
  } catch (error) {
    console.error('[AI] Project intelligence error:', error);
    throw error;
  }
}

/**
 * Analysiert Dokumente
 */
async function analyzeDocument(content: string, analysisType?: string) {
  try {
    // Basis-Analyse durchführen
    const wordCount = content.split(' ').length;
    const sections = content.split('\n\n').filter(s => s.trim().length > 0);

    return {
      analysisType: analysisType || 'general',
      summary: {
        wordCount,
        sectionCount: sections.length,
        estimatedReadingTime: Math.ceil(wordCount / 200) // Wörter pro Minute
      },
      keyPoints: sections.slice(0, 5).map(s => s.substring(0, 100) + '...'),
      complianceRequirements: [], // Würde mit KI gefüllt werden
      actionItems: [], // Würde mit KI gefüllt werden
      riskAssessment: 'medium', // Würde mit KI analysiert werden
      recommendations: [
        'Dokument gründlich prüfen',
        'Relevante Abschnitte extrahieren',
        'Compliance-Check durchführen',
        'Implementierungsplan erstellen'
      ]
    };
  } catch (error) {
    console.error('[AI] Document analysis error:', error);
    throw error;
  }
}
