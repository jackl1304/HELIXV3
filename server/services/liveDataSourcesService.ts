import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from '../storage';
import type { InsertRegulatoryUpdate, InsertDataSource } from '@shared/schema';

interface LiveDataSource {
  id: string;
  name: string;
  url: string;
  type: 'api' | 'rss' | 'scraping';
  region: string;
  active: boolean;
  fetchMethod: () => Promise<any[]>;
}

export class LiveDataSourcesService {
  private userAgent = 'Helix-Regulatory-Intelligence/2.0 (MedTech Compliance Platform)';
  private requestDelay = 2000;

  // Source IDs für Quellenattribution
  private readonly SOURCE_IDS = {
    EMA: 'ema',
    MHRA: 'mhra',
    TGA: 'tga',
    FDA: 'fda',
    HEALTH_CANADA: 'health-canada',
    BFARM: 'bfarm',
    SWISSMEDIC: 'swissmedic',
    WHO: 'who',
    REGULATORY_RAPPORTEUR: 'regulatory-rapporteur',
    MEDTECH_DIVE: 'medtech-dive',
    JAMA: 'jama-network'
  };

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parseDate(dateString: string): Date {
    // Robustes Datum-Parsing für verschiedene Formate
    if (!dateString || dateString.trim() === '') {
      return new Date();
    }
    
    // Bereinige Datum-String (entferne zusätzlichen Text wie " | News")
    const cleanDate = dateString.split('|')[0].trim();
    
    // Versuche ISO-Format zuerst (YYYY-MM-DD, datetime)
    let parsed = new Date(cleanDate);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // Versuche europäisches Format (DD/MM/YYYY)
    const euroMatch = cleanDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (euroMatch) {
      const [_, day, month, year] = euroMatch;
      parsed = new Date(`${year}-${month}-${day}`);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    // Fallback zu aktuellem Datum
    console.warn(`[LiveData] Could not parse date: "${dateString}", using current date`);
    return new Date();
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, {
          headers: { 'User-Agent': this.userAgent },
          timeout: 15000,
        });
        return response.data;
      } catch (error) {
        console.error(`[LiveData] Attempt ${i + 1} failed for ${url}:`, error);
        if (i === retries - 1) throw error;
        await this.delay(this.requestDelay * (i + 1));
      }
    }
    throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
  }

  async fetchEMAUpdates(): Promise<any[]> {
    console.log('[LiveData] Fetching EMA updates...');
    try {
      const url = 'https://www.ema.europa.eu/en/news-events/whats-new';
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);
      
      const updates: any[] = [];
      $('.ecl-content-item').each((i, elem) => {
        const title = $(elem).find('.ecl-content-item__title').text().trim();
        const description = $(elem).find('.ecl-content-item__description').text().trim();
        const link = $(elem).find('a').attr('href');
        const date = $(elem).find('.ecl-content-item__meta').text().trim();
        
        if (title && link) {
          updates.push({
            title,
            description,
            source_id: this.SOURCE_IDS.EMA,
            documentUrl: link.startsWith('http') ? link : `https://www.ema.europa.eu${link}`,
            publishedDate: this.parseDate(date),
            jurisdiction: 'EU',
            region: 'Europe'
          });
        }
      });
      
      console.log(`[LiveData] EMA: Found ${updates.length} updates`);
      return updates;
    } catch (error) {
      console.error('[LiveData] EMA fetch failed:', error);
      return [];
    }
  }

  async fetchRegulatoryRapporteur(): Promise<any[]> {
    console.log('[LiveData] Fetching Regulatory Rapporteur updates...');
    try {
      const url = 'https://www.regulatoryrapporteur.org/';
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);
      
      const updates: any[] = [];
      $('.article-card, .post-item').each((i, elem) => {
        const title = $(elem).find('h2, h3, .title').text().trim();
        const description = $(elem).find('.excerpt, .description, p').first().text().trim();
        const link = $(elem).find('a').attr('href');
        
        if (title && link) {
          const dateElem = $(elem).find('time, .date, .published').first();
          const dateStr = dateElem.attr('datetime') || dateElem.text().trim();
          
          updates.push({
            title,
            description,
            source_id: this.SOURCE_IDS.REGULATORY_RAPPORTEUR,
            documentUrl: link.startsWith('http') ? link : `https://www.regulatoryrapporteur.org${link}`,
            publishedDate: this.parseDate(dateStr),
            jurisdiction: 'International',
            region: 'Global'
          });
        }
      });
      
      console.log(`[LiveData] Regulatory Rapporteur: Found ${updates.length} updates`);
      return updates;
    } catch (error) {
      console.error('[LiveData] Regulatory Rapporteur fetch failed:', error);
      return [];
    }
  }

  async fetchMHRAUpdates(): Promise<any[]> {
    console.log('[LiveData] Fetching MHRA updates...');
    try {
      const url = 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency/latest';
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);
      
      const updates: any[] = [];
      $('.gem-c-document-list__item').each((i, elem) => {
        const title = $(elem).find('.gem-c-document-list__item-title').text().trim();
        const description = $(elem).find('.gem-c-document-list__item-description').text().trim();
        const link = $(elem).find('a').attr('href');
        const date = $(elem).find('time').attr('datetime');
        
        if (title && link) {
          updates.push({
            title,
            description,
            source_id: this.SOURCE_IDS.MHRA,
            documentUrl: link.startsWith('http') ? link : `https://www.gov.uk${link}`,
            publishedDate: this.parseDate(date || ''),
            jurisdiction: 'UK',
            region: 'Europe'
          });
        }
      });
      
      console.log(`[LiveData] MHRA: Found ${updates.length} updates`);
      return updates;
    } catch (error) {
      console.error('[LiveData] MHRA fetch failed:', error);
      return [];
    }
  }

  async fetchTGAUpdates(): Promise<any[]> {
    console.log('[LiveData] Fetching TGA Australia updates...');
    try {
      const url = 'https://www.tga.gov.au/news-and-updates';
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);
      
      const updates: any[] = [];
      $('.views-row, .news-item').each((i, elem) => {
        const title = $(elem).find('h2, h3, .title').text().trim();
        const description = $(elem).find('.field--name-field-summary, .summary').text().trim();
        const link = $(elem).find('a').attr('href');
        
        if (title && link) {
          const dateElem = $(elem).find('time, .date, .field--name-field-date').first();
          const dateStr = dateElem.attr('datetime') || dateElem.text().trim();
          
          updates.push({
            title,
            description,
            source_id: this.SOURCE_IDS.TGA,
            documentUrl: link.startsWith('http') ? link : `https://www.tga.gov.au${link}`,
            publishedDate: this.parseDate(dateStr),
            jurisdiction: 'Australia',
            region: 'APAC'
          });
        }
      });
      
      console.log(`[LiveData] TGA: Found ${updates.length} updates`);
      return updates;
    } catch (error) {
      console.error('[LiveData] TGA fetch failed:', error);
      return [];
    }
  }

  async fetchHealthCanadaUpdates(): Promise<any[]> {
    console.log('[LiveData] Fetching Health Canada updates...');
    try {
      const url = 'https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices.html';
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);
      
      const updates: any[] = [];
      $('.gc-nws-lnk, .most-requested-item').each((i, elem) => {
        const title = $(elem).find('a').text().trim() || $(elem).text().trim();
        const link = $(elem).find('a').attr('href');
        
        if (title && link) {
          const dateElem = $(elem).find('time, .date, .updated').first();
          const dateStr = dateElem.attr('datetime') || dateElem.text().trim();
          
          updates.push({
            title,
            description: `Health Canada medical device update: ${title}`,
            source_id: this.SOURCE_IDS.HEALTH_CANADA,
            documentUrl: link.startsWith('http') ? link : `https://www.canada.ca${link}`,
            publishedDate: this.parseDate(dateStr),
            jurisdiction: 'Canada',
            region: 'North America'
          });
        }
      });
      
      console.log(`[LiveData] Health Canada: Found ${updates.length} updates`);
      return updates;
    } catch (error) {
      console.error('[LiveData] Health Canada fetch failed:', error);
      return [];
    }
  }

  async fetchBfARMUpdates(): Promise<any[]> {
    console.log('[LiveData] Fetching BfArM updates...');
    try {
      const url = 'https://www.bfarm.de/DE/Medizinprodukte/_node.html';
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);
      
      const updates: any[] = [];
      $('.teaser, .news-item').each((i, elem) => {
        const title = $(elem).find('h2, h3, .title').text().trim();
        const description = $(elem).find('.text, p').first().text().trim();
        const link = $(elem).find('a').attr('href');
        
        if (title && link) {
          const dateElem = $(elem).find('time, .date, .published').first();
          const dateStr = dateElem.attr('datetime') || dateElem.text().trim();
          
          updates.push({
            title,
            description,
            source_id: this.SOURCE_IDS.BFARM,
            documentUrl: link.startsWith('http') ? link : `https://www.bfarm.de${link}`,
            publishedDate: this.parseDate(dateStr),
            jurisdiction: 'Germany',
            region: 'Europe'
          });
        }
      });
      
      console.log(`[LiveData] BfArM: Found ${updates.length} updates`);
      return updates;
    } catch (error) {
      console.error('[LiveData] BfArM fetch failed:', error);
      return [];
    }
  }

  async fetchSwissmedicUpdates(): Promise<any[]> {
    console.log('[LiveData] Fetching Swissmedic updates...');
    try {
      const url = 'https://www.swissmedic.ch/swissmedic/en/home/news.html';
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);
      
      const updates: any[] = [];
      $('.news-item, .article').each((i, elem) => {
        const title = $(elem).find('h2, h3, .title').text().trim();
        const description = $(elem).find('.lead, .description').text().trim();
        const link = $(elem).find('a').attr('href');
        
        if (title && link) {
          const dateElem = $(elem).find('time, .date, .published').first();
          const dateStr = dateElem.attr('datetime') || dateElem.text().trim();
          
          updates.push({
            title,
            description,
            source_id: this.SOURCE_IDS.SWISSMEDIC,
            documentUrl: link.startsWith('http') ? link : `https://www.swissmedic.ch${link}`,
            publishedDate: this.parseDate(dateStr),
            jurisdiction: 'Switzerland',
            region: 'Europe'
          });
        }
      });
      
      console.log(`[LiveData] Swissmedic: Found ${updates.length} updates`);
      return updates;
    } catch (error) {
      console.error('[LiveData] Swissmedic fetch failed:', error);
      return [];
    }
  }

  async fetchWHOUpdates(): Promise<any[]> {
    console.log('[LiveData] Fetching WHO updates...');
    try {
      const url = 'https://www.who.int/news-room/releases';
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);
      
      const updates: any[]  = [];
      $('.link-container, .sf-list-item').each((i, elem) => {
        const title = $(elem).find('.link-title, h3').text().trim();
        const description = $(elem).find('.link-description, p').text().trim();
        const link = $(elem).find('a').attr('href');
        
        if (title && link && title.toLowerCase().includes('medic')) {
          const dateElem = $(elem).find('time, .date, .sf-field-date').first();
          const dateStr = dateElem.attr('datetime') || dateElem.text().trim();
          
          updates.push({
            title,
            description,
            source_id: this.SOURCE_IDS.WHO,
            documentUrl: link.startsWith('http') ? link : `https://www.who.int${link}`,
            publishedDate: this.parseDate(dateStr),
            jurisdiction: 'Global',
            region: 'Global'
          });
        }
      });
      
      console.log(`[LiveData] WHO: Found ${updates.length} updates`);
      return updates;
    } catch (error) {
      console.error('[LiveData] WHO fetch failed:', error);
      return [];
    }
  }

  async fetchJAMANetworkUpdates(): Promise<any[]> {
    console.log('[LiveData] Fetching JAMA Network updates...');
    try {
      const url = 'https://jamanetwork.com/collections/44068/medical-devices-and-technology';
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);
      
      const updates: any[] = [];
      $('.card, .articleItem').each((i, elem) => {
        const title = $(elem).find('h3, .title').text().trim();
        const description = $(elem).find('.abstract, .description').text().trim();
        const link = $(elem).find('a').attr('href');
        
        if (title && link) {
          const dateElem = $(elem).find('time, .date, .published-date').first();
          const dateStr = dateElem.attr('datetime') || dateElem.text().trim();
          
          updates.push({
            title,
            description,
            source_id: this.SOURCE_IDS.JAMA,
            documentUrl: link.startsWith('http') ? link : `https://jamanetwork.com${link}`,
            publishedDate: this.parseDate(dateStr),
            jurisdiction: 'International',
            region: 'Global',
            category: 'research'
          });
        }
      });
      
      console.log(`[LiveData] JAMA: Found ${updates.length} updates`);
      return updates;
    } catch (error) {
      console.error('[LiveData] JAMA Network fetch failed:', error);
      return [];
    }
  }

  async fetchMedTechNewsUpdates(): Promise<any[]> {
    console.log('[LiveData] Fetching MedTech news updates...');
    try {
      const url = 'https://www.medtechdive.com/';
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);
      
      const updates: any[] = [];
      $('.feed__item, .article').each((i, elem) => {
        const title = $(elem).find('.feed__title, h3').text().trim();
        const description = $(elem).find('.feed__description, .summary').text().trim();
        const link = $(elem).find('a').attr('href');
        
        if (title && link) {
          const dateElem = $(elem).find('time, .feed__date, .published').first();
          const dateStr = dateElem.attr('datetime') || dateElem.text().trim();
          
          updates.push({
            title,
            description,
            source_id: this.SOURCE_IDS.MEDTECH_DIVE,
            documentUrl: link.startsWith('http') ? link : `https://www.medtechdive.com${link}`,
            publishedDate: this.parseDate(dateStr),
            jurisdiction: 'International',
            region: 'Global',
            category: 'news'
          });
        }
      });
      
      console.log(`[LiveData] MedTech News: Found ${updates.length} updates`);
      return updates;
    } catch (error) {
      console.error('[LiveData] MedTech News fetch failed:', error);
      return [];
    }
  }

  async syncAllLiveSources(): Promise<{
    successful: number;
    failed: number;
    totalUpdates: number;
    details: any[];
  }> {
    console.log('[LiveData] Starting comprehensive sync of all live data sources...');
    
    const sources = [
      { name: 'EMA', fn: () => this.fetchEMAUpdates() },
      { name: 'Regulatory Rapporteur', fn: () => this.fetchRegulatoryRapporteur() },
      { name: 'MHRA', fn: () => this.fetchMHRAUpdates() },
      { name: 'TGA', fn: () => this.fetchTGAUpdates() },
      { name: 'Health Canada', fn: () => this.fetchHealthCanadaUpdates() },
      { name: 'BfArM', fn: () => this.fetchBfARMUpdates() },
      { name: 'Swissmedic', fn: () => this.fetchSwissmedicUpdates() },
      { name: 'WHO', fn: () => this.fetchWHOUpdates() },
      { name: 'JAMA Network', fn: () => this.fetchJAMANetworkUpdates() },
      { name: 'MedTech News', fn: () => this.fetchMedTechNewsUpdates() },
    ];

    const results = [];
    let successful = 0;
    let failed = 0;
    let totalUpdates = 0;

    for (const source of sources) {
      try {
        await this.delay(this.requestDelay);
        const updates = await source.fn();
        
        if (updates.length > 0) {
          successful++;
          totalUpdates += updates.length;
          results.push({
            source: source.name,
            success: true,
            updates: updates.length,
            data: updates
          });
          
          console.log(`✅ [LiveData] ${source.name}: ${updates.length} updates fetched`);
        } else {
          successful++;
          results.push({
            source: source.name,
            success: true,
            updates: 0,
            message: 'No new updates found'
          });
        }
      } catch (error) {
        failed++;
        results.push({
          source: source.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ [LiveData] ${source.name} failed:`, error);
      }
    }

    console.log(`[LiveData] Sync complete: ${successful} successful, ${failed} failed, ${totalUpdates} total updates`);

    return {
      successful,
      failed,
      totalUpdates,
      details: results
    };
  }

  async initializeLiveDataSources(): Promise<void> {
    console.log('[LiveData] Initializing live data sources in database...');
    
    const sources: InsertDataSource[] = [
      {
        id: 'ema',
        name: 'European Medicines Agency (EMA)',
        description: 'Live updates from EMA on medical device regulations',
        url: 'https://www.ema.europa.eu/en/news-events/whats-new',
        country: 'EU',
        region: 'Europe',
        type: 'regulatory',
        category: 'regulatory_authority',
        language: 'en',
        isActive: true,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'regulatory-rapporteur',
        name: 'Regulatory Rapporteur',
        description: 'Medical device standards and regulatory updates',
        url: 'https://www.regulatoryrapporteur.org/',
        country: 'International',
        region: 'Global',
        type: 'regulatory',
        category: 'industry_news',
        language: 'en',
        isActive: true,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'mhra',
        name: 'UK MHRA',
        description: 'Medicines and Healthcare products Regulatory Agency updates',
        url: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency',
        country: 'UK',
        region: 'Europe',
        type: 'regulatory',
        category: 'regulatory_authority',
        language: 'en',
        isActive: true,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'tga',
        name: 'TGA Australia',
        description: 'Therapeutic Goods Administration updates',
        url: 'https://www.tga.gov.au/news-and-updates',
        country: 'Australia',
        region: 'APAC',
        type: 'regulatory',
        category: 'regulatory_authority',
        language: 'en',
        isActive: true,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'health-canada',
        name: 'Health Canada',
        description: 'Health Canada medical device updates',
        url: 'https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices.html',
        country: 'Canada',
        region: 'North America',
        type: 'regulatory',
        category: 'regulatory_authority',
        language: 'en',
        isActive: true,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'bfarm',
        name: 'BfArM Deutschland',
        description: 'Bundesinstitut für Arzneimittel und Medizinprodukte',
        url: 'https://www.bfarm.de/DE/Medizinprodukte/_node.html',
        country: 'Germany',
        region: 'Europe',
        type: 'regulatory',
        category: 'regulatory_authority',
        language: 'de',
        isActive: true,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'swissmedic',
        name: 'Swissmedic',
        description: 'Swiss Agency for Therapeutic Products',
        url: 'https://www.swissmedic.ch/',
        country: 'Switzerland',
        region: 'Europe',
        type: 'regulatory',
        category: 'regulatory_authority',
        language: 'en',
        isActive: true,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'who',
        name: 'WHO Medical Devices',
        description: 'World Health Organization medical device updates',
        url: 'https://www.who.int/',
        country: 'Global',
        region: 'Global',
        type: 'regulatory',
        category: 'international_organization',
        language: 'en',
        isActive: true,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'jama-network',
        name: 'JAMA Network',
        description: 'Medical device research and publications',
        url: 'https://jamanetwork.com/',
        country: 'International',
        region: 'Global',
        type: 'standards',
        category: 'research',
        language: 'en',
        isActive: true,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'medtech-dive',
        name: 'MedTech Dive',
        description: 'Medical technology industry news',
        url: 'https://www.medtechdive.com/',
        country: 'International',
        region: 'Global',
        type: 'regulatory',
        category: 'industry_news',
        language: 'en',
        isActive: true,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'eu-commission-mdr',
        name: 'EU Commission MDR/IVDR',
        description: 'EU Medical Device Regulation and IVDR updates with RSS feed',
        url: 'https://health.ec.europa.eu/medical-devices-new-regulations_en',
        country: 'EU',
        region: 'Europe',
        type: 'regulatory',
        category: 'regulatory_authority',
        language: 'en',
        isActive: false,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'mdcg',
        name: 'MDCG Guidance Documents',
        description: 'Medical Device Coordination Group guidance documents',
        url: 'https://health.ec.europa.eu/medical-devices-sector/overview-guidance-documents_en',
        country: 'EU',
        region: 'Europe',
        type: 'regulatory',
        category: 'regulatory_authority',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'imdrf',
        name: 'IMDRF',
        description: 'International Medical Device Regulators Forum documents',
        url: 'https://www.imdrf.org/documents/',
        country: 'International',
        region: 'Global',
        type: 'regulatory',
        category: 'international_organization',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'fda-openfda-api',
        name: 'FDA OpenFDA API',
        description: 'FDA device data via API: Events, Recalls, 510(k), PMA',
        url: 'https://open.fda.gov/apis/device/',
        country: 'USA',
        region: 'North America',
        type: 'regulatory',
        category: 'regulatory_authority',
        language: 'en',
        isActive: false,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'fda-guidance',
        name: 'FDA Guidance Documents',
        description: 'FDA medical device guidance and federal register',
        url: 'https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance/guidance-documents-medical-devices-and-radiation-emitting-products',
        country: 'USA',
        region: 'North America',
        type: 'regulatory',
        category: 'regulatory_authority',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'clinicaltrials-gov',
        name: 'ClinicalTrials.gov',
        description: 'Clinical trials database with API access',
        url: 'https://clinicaltrials.gov/api/info',
        country: 'USA',
        region: 'Global',
        type: 'standards',
        category: 'research',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'eu-ctis',
        name: 'EU Clinical Trials (CTIS)',
        description: 'EU Clinical Trials Information System',
        url: 'https://www.clinicaltrialsregister.eu/',
        country: 'EU',
        region: 'Europe',
        type: 'standards',
        category: 'research',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'epo-espacenet',
        name: 'European Patent Office (Espacenet)',
        description: 'European patent database with API access',
        url: 'https://worldwide.espacenet.com/',
        country: 'EU',
        region: 'Europe',
        type: 'standards',
        category: 'patents',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'wipo-patentscope',
        name: 'WIPO PATENTSCOPE',
        description: 'World Intellectual Property Organization patent database',
        url: 'https://patentscope.wipo.int/',
        country: 'International',
        region: 'Global',
        type: 'standards',
        category: 'patents',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'uspto-api',
        name: 'USPTO PatentsView API',
        description: 'US Patent and Trademark Office API',
        url: 'https://patentsview.org/apis/api-endpoints',
        country: 'USA',
        region: 'North America',
        type: 'standards',
        category: 'patents',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'pubmed-api',
        name: 'PubMed/Entrez API',
        description: 'NIH PubMed medical literature database',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK25499/',
        country: 'USA',
        region: 'Global',
        type: 'standards',
        category: 'research',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'medrxiv',
        name: 'medRxiv Preprints',
        description: 'Medical research preprint server',
        url: 'https://www.medrxiv.org/',
        country: 'International',
        region: 'Global',
        type: 'standards',
        category: 'research',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'europe-pmc',
        name: 'Europe PMC API',
        description: 'European PubMed Central API',
        url: 'https://europepmc.org/RestfulWebService',
        country: 'EU',
        region: 'Europe',
        type: 'standards',
        category: 'research',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'eu-court-justice',
        name: 'EU Court of Justice (Curia)',
        description: 'European Court of Justice case law',
        url: 'https://curia.europa.eu/jcms/jcms/j_6/en/',
        country: 'EU',
        region: 'Europe',
        type: 'regulatory',
        category: 'legal',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'courtlistener-api',
        name: 'CourtListener API (US)',
        description: 'US federal and state court opinions API',
        url: 'https://www.courtlistener.com/api/rest-info/',
        country: 'USA',
        region: 'North America',
        type: 'regulatory',
        category: 'legal',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
      {
        id: 'iso-standards',
        name: 'ISO Standards Catalogue',
        description: 'ISO medical device standards metadata (ICS 11.100, 11.040)',
        url: 'https://www.iso.org/standards-catalogue/browse-by-ics.html',
        country: 'International',
        region: 'Global',
        type: 'standards',
        category: 'standards_body',
        language: 'en',
        isActive: false,
        syncFrequency: 'monthly',
        authRequired: false,
      },
      {
        id: 'emergo-ul',
        name: 'Emergo by UL',
        description: 'Emergo regulatory news and updates',
        url: 'https://www.emergobyul.com/resources/regulatory-news',
        country: 'International',
        region: 'Global',
        type: 'regulatory',
        category: 'industry_news',
        language: 'en',
        isActive: false,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'medtech-europe',
        name: 'MedTech Europe',
        description: 'European medical technology industry association',
        url: 'https://www.medtecheurope.org/',
        country: 'EU',
        region: 'Europe',
        type: 'regulatory',
        category: 'industry_news',
        language: 'en',
        isActive: false,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'raps',
        name: 'RAPS Regulatory Focus',
        description: 'Regulatory Affairs Professionals Society news',
        url: 'https://www.raps.org/news-and-articles/news-articles',
        country: 'International',
        region: 'Global',
        type: 'regulatory',
        category: 'industry_news',
        language: 'en',
        isActive: false,
        syncFrequency: 'daily',
        authRequired: false,
      },
      {
        id: 'ptc-medtech',
        name: 'PTC Medical Devices Blog',
        description: 'PTC medical technology insights',
        url: 'https://www.ptc.com/en/blogs/medtech',
        country: 'International',
        region: 'Global',
        type: 'regulatory',
        category: 'industry_news',
        language: 'en',
        isActive: false,
        syncFrequency: 'weekly',
        authRequired: false,
      },
    ];

    for (const source of sources) {
      try {
        await storage.createDataSource(source);
        console.log(`✅ [LiveData] Initialized source: ${source.name}`);
      } catch (error) {
        console.error(`❌ [LiveData] Failed to initialize ${source.name}:`, error);
      }
    }

    console.log('[LiveData] All live data sources initialized');
  }
}

export const liveDataSourcesService = new LiveDataSourcesService();
