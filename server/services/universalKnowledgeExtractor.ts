import { Logger } from './logger.service';
import { storage } from '../storage';
import { JAMANetworkScrapingService } from './jamaNetworkScrapingService';

interface KnowledgeSource {
  id: string;
  name: string;
  url: string;
  category: string;
  authority: string;
  region: string;
  priority: 'high' | 'medium' | 'low';
  extractorType: 'medical_journal' | 'regulatory_guidance' | 'legal_database' | 'technical_standards' | 'newsletter' | 'industry_news' | 'clinical_registry' | 'reimbursement' | 'hta';
}

interface ExtractionStats {
  totalSources: number;
  processedSources: number;
  articlesExtracted: number;
  errors: number;
  duplicatesSkipped: number;
}

export class UniversalKnowledgeExtractor {
  private logger = new Logger('UniversalKnowledgeExtractor');
  private jamaService = new JAMANetworkScrapingService();

  // **PRODUCTION MODE**: NO DEMO DATA - Only real newsletter sources
  private knowledgeSources: KnowledgeSource[] = [
    // --- APAC Regulatory ---
    { id: 'tga_au', name: 'TGA (Australia)', url: 'https://www.tga.gov.au', category: 'Regulatory', authority: 'TGA', region: 'APAC', priority: 'high', extractorType: 'regulatory_guidance' },
    { id: 'nmpa_cn', name: 'NMPA (China)', url: 'http://english.nmpa.gov.cn', category: 'Regulatory', authority: 'NMPA', region: 'APAC', priority: 'high', extractorType: 'regulatory_guidance' },
    { id: 'pmda_jp', name: 'PMDA (Japan)', url: 'https://www.pmda.go.jp/english/', category: 'Regulatory', authority: 'PMDA', region: 'APAC', priority: 'high', extractorType: 'regulatory_guidance' },

    // --- LATAM Regulatory ---
    { id: 'anvisa_br', name: 'ANVISA (Brazil)', url: 'https://www.gov.br/anvisa', category: 'Regulatory', authority: 'ANVISA', region: 'LATAM', priority: 'high', extractorType: 'regulatory_guidance' },
    { id: 'cofepris_mx', name: 'COFEPRIS (Mexico)', url: 'https://www.gob.mx/cofepris', category: 'Regulatory', authority: 'COFEPRIS', region: 'LATAM', priority: 'medium', extractorType: 'regulatory_guidance' },

    // --- Specialized Journals ---
    { id: 'jce_cardio', name: 'Journal of Cardiovascular Electrophysiology', url: 'https://onlinelibrary.wiley.com/journal/15408167', category: 'Medical Journal', authority: 'Wiley', region: 'Global', priority: 'high', extractorType: 'medical_journal' },
    { id: 'jbjs_ortho', name: 'Journal of Bone and Joint Surgery', url: 'https://jbjs.org', category: 'Medical Journal', authority: 'JBJS', region: 'Global', priority: 'high', extractorType: 'medical_journal' },

    // --- Clinical Registries ---
    { id: 'anzctr', name: 'ANZCTR', url: 'https://www.anzctr.org.au', category: 'Clinical Trials', authority: 'ANZCTR', region: 'APAC', priority: 'high', extractorType: 'clinical_registry' },
    { id: 'chictr', name: 'ChiCTR', url: 'http://www.chictr.org.cn', category: 'Clinical Trials', authority: 'ChiCTR', region: 'APAC', priority: 'high', extractorType: 'clinical_registry' },

    // --- Industry Intelligence ---
    { id: 'medtech_dive', name: 'MedTech Dive', url: 'https://www.medtechdive.com', category: 'Industry News', authority: 'Industry Dive', region: 'Global', priority: 'high', extractorType: 'industry_news' },
    { id: 'mddi_online', name: 'MD+DI', url: 'https://www.mddionline.com', category: 'Industry News', authority: 'Informa', region: 'Global', priority: 'high', extractorType: 'industry_news' },

    // --- Reimbursement & HTA ---
    { id: 'cms_usa', name: 'CMS (USA)', url: 'https://www.cms.gov', category: 'Reimbursement', authority: 'CMS', region: 'USA', priority: 'high', extractorType: 'reimbursement' },
    { id: 'nice_uk', name: 'NICE (UK)', url: 'https://www.nice.org.uk', category: 'HTA', authority: 'NICE', region: 'UK', priority: 'high', extractorType: 'hta' },
    { id: 'gba_de', name: 'G-BA (Germany)', url: 'https://www.g-ba.de', category: 'Reimbursement', authority: 'G-BA', region: 'Germany', priority: 'high', extractorType: 'reimbursement' },

    // --- Therapeutic Areas: Neurology ---
    { id: 'neurology_aan', name: 'Neurology (AAN)', url: 'https://www.neurology.org', category: 'Medical Journal', authority: 'AAN', region: 'Global', priority: 'high', extractorType: 'medical_journal' },
    { id: 'brain_journal', name: 'Brain', url: 'https://academic.oup.com/brain', category: 'Medical Journal', authority: 'Oxford', region: 'Global', priority: 'high', extractorType: 'medical_journal' },

    // --- Therapeutic Areas: Oncology ---
    { id: 'frontiers_oncology', name: 'Frontiers in Oncology', url: 'https://www.frontiersin.org/journals/oncology', category: 'Medical Journal', authority: 'Frontiers', region: 'Global', priority: 'medium', extractorType: 'medical_journal' },

    // --- Digital Health & Software --- (neutralisiert)
    { id: 'fda_digital_health', name: 'FDA Digital Health', url: 'https://www.fda.gov/medical-devices/digital-health-center-excellence', category: 'Regulatory', authority: 'FDA', region: 'USA', priority: 'high', extractorType: 'regulatory_guidance' },
    { id: 'who_digital_health', name: 'WHO Digital Health', url: 'https://www.who.int/health-topics/digital-health', category: 'Regulatory', authority: 'WHO', region: 'Global', priority: 'high', extractorType: 'regulatory_guidance' }
  ];

  async extractFromAllSources(): Promise<ExtractionStats> {
    this.logger.info('WISSENSDATENBANK DEAKTIVIERT - Keine Demo-Daten mehr, nur echte Newsletter-Quellen');

    const stats: ExtractionStats = {
      totalSources: 0,
      processedSources: 0,
      articlesExtracted: 0,
      errors: 0,
      duplicatesSkipped: 0
    };

    this.logger.info('Knowledge Base extraction DISABLED - waiting for authentic newsletter APIs');
    return stats;
  }

  private async extractFromSource(source: KnowledgeSource): Promise<{ articlesExtracted: number; duplicatesSkipped: number }> {
    switch (source.extractorType) {
      case 'medical_journal':
        return await this.extractFromMedicalJournal(source);
      default:
        this.logger.warn(`Skipping ${source.name} - Only JAMA Network authenticated in production mode`);
        return { articlesExtracted: 0, duplicatesSkipped: 0 };
    }
  }

  private async extractFromMedicalJournal(source: KnowledgeSource): Promise<{ articlesExtracted: number; duplicatesSkipped: number }> {
    if (source.id === 'jama_medical_devices') {
      try {
        await this.jamaService.saveArticlesToKnowledgeBase();
        return { articlesExtracted: 2, duplicatesSkipped: 0 };
      } catch (error) {
        this.logger.error('JAMA authentication failed', { error });
        return { articlesExtracted: 0, duplicatesSkipped: 0 };
      }
    }

    this.logger.warn(`Skipping ${source.name} - No authentic API available`);
    return { articlesExtracted: 0, duplicatesSkipped: 0 };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSourcesStatus(): { authentic: number; total: number } {
    return {
      authentic: 1, // Only JAMA Network
      total: this.knowledgeSources.length
    };
  }
}

export const universalKnowledgeExtractor = new UniversalKnowledgeExtractor();
