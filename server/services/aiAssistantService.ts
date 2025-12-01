import { callGroqChatStreaming } from './groqService.js';
import { storage } from '../storage.js';

export interface AIAssistantContext {
  userId?: string;
  tenantId?: string;
  currentPage?: string;
  selectedItems?: string[];
  searchQuery?: string;
  filters?: Record<string, any>;
}

export interface AIResponse {
  answer: string;
  sources: Array<{
    type: 'regulatory_update' | 'legal_case' | 'patent' | 'knowledge_article' | 'project' | 'external';
    id: string;
    title: string;
    relevance: number;
    url?: string;
  }>;
  suggestions: string[];
  actions: Array<{
    type: 'search' | 'filter' | 'navigate' | 'create' | 'export';
    label: string;
    data: any;
  }>;
  confidence: number;
}

/**
 * Fortgeschrittener KI-Assistent für Helix
 * Versteht Kontext, sucht in Datenbanken, generiert Dokumente
 */
export class AIAssistantService {
  private context: AIAssistantContext = {};

  setContext(context: AIAssistantContext) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Hauptfunktion: Verarbeitet Benutzerfragen
   */
  async processQuery(query: string): Promise<AIResponse> {
    try {
      // 1. Kontext analysieren
      const contextAnalysis = await this.analyzeContext(query);

      // 2. In Helix-Datenbanken suchen
      const searchResults = await this.searchHelixData(query, contextAnalysis);

      // 3. KI-generierte Antwort erstellen
      const aiResponse = await this.generateAIResponse(query, contextAnalysis, searchResults);

      // 4. Aktionen und Vorschläge generieren
      const actions = await this.generateActions(query, contextAnalysis, searchResults);

      return {
        answer: aiResponse,
        sources: searchResults.sources,
        suggestions: searchResults.suggestions,
        actions,
        confidence: searchResults.confidence
      };
    } catch (error) {
      console.error('[AIAssistant] Error processing query:', error);
      return {
        answer: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es erneut.',
        sources: [],
        suggestions: ['Versuchen Sie Ihre Frage umzuformulieren', 'Überprüfen Sie die Rechtschreibung'],
        actions: [],
        confidence: 0
      };
    }
  }

  /**
   * Analysiert den Kontext der Frage
   */
  private async analyzeContext(query: string) {
    const systemPrompt = `
    Du bist ein Experte für Medizinprodukte-Regulierung.
    Analysiere diese Frage und bestimme:
    1. Fachbereich (regulatory, legal, patents, projects, quality, clinical)
    2. Geografische Region (EU, US, DE, UK, etc.)
    3. Spezifische Anforderungen (guidance, approval, compliance, etc.)
    4. Dringlichkeit (high, medium, low)

    Antworte nur mit JSON im Format:
    {
      "domain": "regulatory|legal|patents|projects|quality|clinical",
      "region": "EU|US|DE|UK|global",
      "requirements": ["guidance", "approval", "compliance"],
      "urgency": "high|medium|low",
      "keywords": ["keyword1", "keyword2"]
    }
    `;

    const analysisJson = await callGroqChatStreaming(query, systemPrompt);
    try {
      return JSON.parse(analysisJson);
    } catch {
      return {
        domain: 'general',
        region: 'global',
        requirements: [],
        urgency: 'medium',
        keywords: []
      };
    }
  }

  /**
   * Sucht in allen Helix-Datenbanken
   */
  private async searchHelixData(query: string, context: any) {
    const sources: AIResponse['sources'] = [];
    const suggestions: string[] = [];
    let confidence = 0;

    try {
      // 1. Regulatorische Updates durchsuchen
      if (context.domain === 'regulatory' || context.domain === 'general') {
        const updates = await storage.getAllRegulatoryUpdates();
        const relevantUpdates = this.findRelevantItems(updates, query, context.keywords);

        relevantUpdates.slice(0, 5).forEach(update => {
          sources.push({
            type: 'regulatory_update',
            id: update.id,
            title: update.title,
            relevance: this.calculateRelevance(update, query),
            url: update.document_url
          });
        });
      }

      // 2. Rechtsfälle durchsuchen
      if (context.domain === 'legal' || context.domain === 'general') {
        const legalCases = await storage.getAllLegalCases();
        const relevantCases = this.findRelevantItems(legalCases, query, context.keywords);

        relevantCases.slice(0, 3).forEach(case_ => {
          sources.push({
            type: 'legal_case',
            id: case_.id,
            title: case_.title,
            relevance: this.calculateRelevance(case_, query)
          });
        });
      }

      // 3. Patente durchsuchen
      if (context.domain === 'patents' || context.domain === 'general') {
        const patents = await storage.getAllPatents(50);
        const relevantPatents = this.findRelevantItems(patents, query, context.keywords);

        relevantPatents.slice(0, 3).forEach(patent => {
          sources.push({
            type: 'patent',
            id: patent.id,
            title: patent.title,
            relevance: this.calculateRelevance(patent, query)
          });
        });
      }

      // 4. Wissensartikel durchsuchen
      const knowledgeArticles = await storage.getAllKnowledgeArticles();
      const relevantArticles = this.findRelevantItems(knowledgeArticles, query, context.keywords);

      relevantArticles.slice(0, 3).forEach(article => {
        sources.push({
          type: 'knowledge_article',
          id: article.id,
          title: article.title,
          relevance: this.calculateRelevance(article, query)
        });
      });

      // 5. Projekte durchsuchen (falls relevant)
      if (context.domain === 'projects') {
        const projects = await storage.getAllProjects();
        const relevantProjects = this.findRelevantItems(projects, query, context.keywords);

        relevantProjects.slice(0, 2).forEach(project => {
          sources.push({
            type: 'project',
            id: project.id,
            title: project.name,
            relevance: this.calculateRelevance(project, query)
          });
        });
      }

      // Konfidenz basierend auf gefundenen Quellen berechnen
      confidence = Math.min(sources.length * 20, 100);

      // Vorschläge generieren
      if (sources.length === 0) {
        suggestions.push('Versuchen Sie allgemeinere Suchbegriffe');
        suggestions.push('Überprüfen Sie die Rechtschreibung');
        suggestions.push('Spezifizieren Sie die Region (EU, US, DE, etc.)');
      } else {
        suggestions.push('Klicken Sie auf die Quellen für Details');
        suggestions.push('Verwenden Sie Filter für genauere Ergebnisse');
        if (context.region !== 'global') {
          suggestions.push(`Suchen Sie auch in anderen Regionen als ${context.region}`);
        }
      }

    } catch (error) {
      console.error('[AIAssistant] Error searching Helix data:', error);
    }

    return { sources, suggestions, confidence };
  }

  /**
   * Findet relevante Items basierend auf Query und Keywords
   */
  private findRelevantItems(items: any[], query: string, keywords: string[] = []) {
    const queryLower = query.toLowerCase();
    const allKeywords = [...keywords, ...queryLower.split(' ').filter(w => w.length > 2)];

    return items
      .map(item => ({
        ...item,
        relevanceScore: this.calculateRelevanceScore(item, queryLower, allKeywords)
      }))
      .filter(item => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Berechnet Relevanz-Score für ein Item
   */
  private calculateRelevanceScore(item: any, query: string, keywords: string[]): number {
    let score = 0;

    // Titel-Übereinstimmung
    if (item.title?.toLowerCase().includes(query)) score += 10;
    if (item.name?.toLowerCase().includes(query)) score += 10;

    // Beschreibung/Description-Übereinstimmung
    if (item.description?.toLowerCase().includes(query)) score += 5;
    if (item.summary?.toLowerCase().includes(query)) score += 5;
    if (item.content?.toLowerCase().includes(query)) score += 3;

    // Keyword-Übereinstimmungen
    keywords.forEach(keyword => {
      if (item.title?.toLowerCase().includes(keyword)) score += 3;
      if (item.description?.toLowerCase().includes(keyword)) score += 2;
      if (item.tags?.some((tag: string) => tag.toLowerCase().includes(keyword))) score += 4;
    });

    // Regions- und Domain-spezifische Bonuspunkte
    if (this.context.currentPage?.includes('regulatory') && item.type === 'regulation') score += 2;
    if (this.context.currentPage?.includes('legal') && item.jurisdiction) score += 2;
    if (this.context.currentPage?.includes('patents') && item.publication_number) score += 2;

    return score;
  }

  /**
   * Berechnet einfache Relevanz für UI-Anzeige
   */
  private calculateRelevance(item: any, query: string): number {
    const score = this.calculateRelevanceScore(item, query.toLowerCase(), []);
    return Math.min(Math.max(score, 1), 100);
  }

  /**
   * Generiert KI-Antwort basierend auf gefundenen Daten
   */
  private async generateAIResponse(query: string, context: any, searchResults: any): Promise<string> {
    const systemPrompt = `
    Du bist ein Experte für Medizinprodukte-Regulierung und Helix-KI-Assistent.

    Basierend auf der Frage des Benutzers und den gefundenen Informationen,
    gib eine präzise, hilfreiche Antwort auf Deutsch.

    Kontext: ${JSON.stringify(context)}
    Gefundene Quellen: ${searchResults.sources.length} relevante Dokumente

    Wichtige Regeln:
    - Antworte immer auf Deutsch
    - Sei präzise und fachlich korrekt
    - Erwähne gefundene Quellen
    - Gib konkrete Handlungsempfehlungen
    - Wenn keine Informationen gefunden wurden, schlage alternative Suchen vor
    - Bleibe im Kontext von Medizinprodukten und Regulierung
    `;

    const contextInfo = searchResults.sources.length > 0
      ? `Ich habe ${searchResults.sources.length} relevante Quellen in der Helix-Datenbank gefunden.`
      : 'Ich konnte keine spezifischen Informationen in der Helix-Datenbank finden.';

    const fullPrompt = `${contextInfo} Frage: ${query}`;

    return await callGroqChatStreaming(fullPrompt, systemPrompt);
  }

  /**
   * Generiert Aktionen basierend auf Query und Ergebnissen
   */
  private async generateActions(query: string, context: any, searchResults: any): Promise<AIResponse['actions']> {
    const actions: AIResponse['actions'] = [];

    // Immer verfügbare Aktionen
    actions.push({
      type: 'search',
      label: 'Erweiterte Suche',
      data: { query, filters: context }
    });

    // Seiten-spezifische Aktionen
    if (this.context.currentPage?.includes('regulatory')) {
      actions.push({
        type: 'filter',
        label: 'Nach Region filtern',
        data: { region: context.region }
      });
    }

    if (searchResults.sources.length > 0) {
      actions.push({
        type: 'export',
        label: 'Ergebnisse exportieren',
        data: { sources: searchResults.sources }
      });
    }

    // Projekt-spezifische Aktionen
    if (context.domain === 'projects') {
      actions.push({
        type: 'create',
        label: 'Neues Projekt erstellen',
        data: { template: 'regulatory_pathway' }
      });
    }

    return actions;
  }

  /**
   * Generiert Dokumente und Drafts für Abarbeitung
   */
  async generateDocument(template: string, data: any): Promise<string> {
    const systemPrompt = `
    Du bist ein Dokumentengenerator für Medizinprodukte-Regulierung.

    Erstelle ein professionelles Dokument basierend auf der Vorlage und den Daten.
    Das Dokument soll vollständig, präzise und regulatorisch korrekt sein.

    Vorlage: ${template}
    Daten: ${JSON.stringify(data)}

    Erstelle ein komplettes, umsetzbares Dokument mit allen notwendigen Abschnitten.
    `;

    const prompt = `Erstelle ein ${template}-Dokument mit folgenden Daten: ${JSON.stringify(data)}`;

    return await callGroqChatStreaming(prompt, systemPrompt);
  }

  /**
   * Sucht außerhalb des Systems (wenn erlaubt)
   */
  async searchExternal(query: string, context: any): Promise<AIResponse> {
    const systemPrompt = `
    Du bist ein KI-Assistent für Medizinprodukte-Regulierung.
    Der Benutzer hat erlaubt, außerhalb der Helix-Datenbank zu suchen.

    Suche nach relevanten Informationen zu: ${query}
    Kontext: ${JSON.stringify(context)}

    Gib eine Zusammenfassung der wichtigsten Findings und Quellen.
    Markiere klar, dass dies externe Informationen sind.
    `;

    const externalInfo = await callGroqChatStreaming(query, systemPrompt);

    return {
      answer: `🔍 **Externe Suche Ergebnisse:**\n\n${externalInfo}\n\n*Hinweis: Diese Informationen stammen aus externen Quellen und sind nicht Teil der validierten Helix-Datenbank.*`,
      sources: [{
        type: 'external',
        id: 'external_search',
        title: 'Externe Informationssuche',
        relevance: 50
      }],
      suggestions: [
        'Überprüfen Sie die Gültigkeit externer Informationen',
        'Konsultieren Sie offizielle regulatorische Quellen',
        'Speichern Sie wichtige Findings in Helix'
      ],
      actions: [{
        type: 'create',
        label: 'Als Wissensartikel speichern',
        data: { content: externalInfo, source: 'external_search' }
      }],
      confidence: 70
    };
  }
}

// Singleton-Instanz
export const aiAssistant = new AIAssistantService();
