/**
 * Universal Data Source Scraper
 * Enterprise-grade extraction engine for regulatory, patent, legal, and standards data
 * Supports: RSS, HTML parsing, REST APIs, XML feeds
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import type { DataSource } from '@shared/schema';

export interface ScrapedUpdate {
  title: string;
  description: string;
  published_date: Date;
  url: string;
  source_id: string;
  reference_number?: string;
  jurisdiction?: string;
  status?: string;
  document_type?: string;
  metadata?: Record<string, any>;
  hashedTitle: string;
}

interface ScraperStrategy {
  type: 'rss' | 'html' | 'api' | 'xml';
  selectors?: {
    container?: string;
    title: string;
    description?: string;
    date?: string;
    link?: string;
    reference?: string;
  };
  apiConfig?: {
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    params?: Record<string, any>;
    dataPath?: string; // JSONPath to actual data array
  };
  dateFormat?: string;
}

// Source-specific extraction strategies
const SCRAPER_CONFIGS: Record<string, ScraperStrategy> = {
  // FDA Sources
  'fda_pma': {
    type: 'html',
    selectors: {
      container: 'table.table tbody tr',
      title: 'td:nth-child(2)',
      date: 'td:nth-child(1)',
      link: 'td:nth-child(2) a',
      reference: 'td:nth-child(3)'
    }
  },
  'fda_510k': {
    type: 'html',
    selectors: {
      container: 'table tbody tr',
      title: 'td:nth-child(3)',
      date: 'td:nth-child(1)',
      reference: 'td:nth-child(2)',
      link: 'td:nth-child(3) a'
    }
  },
  'fda_maude': {
    type: 'api',
    apiConfig: {
      method: 'GET',
      params: { limit: 100 },
      dataPath: 'results'
    }
  },
  
  // EMA Sources
  'ema_epar': {
    type: 'rss',
    selectors: {
      title: 'title',
      description: 'description',
      date: 'pubDate',
      link: 'link'
    }
  },
  
  // Patent Sources
  'uspto_search': {
    type: 'api',
    apiConfig: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      dataPath: 'patents'
    }
  },
  'espacenet': {
    type: 'html',
    selectors: {
      container: 'div.patent-result',
      title: 'h3.patent-title',
      description: 'div.patent-abstract',
      date: 'span.publication-date',
      reference: 'span.patent-number'
    }
  },
  
  // Legal Sources
  'pacer': {
    type: 'api',
    apiConfig: {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      dataPath: 'data.cases'
    }
  },
  'courtlistener': {
    type: 'api',
    apiConfig: {
      method: 'GET',
      params: { order_by: '-date_filed' },
      dataPath: 'results'
    }
  },
  
  // Generic RSS for most news/update sources
  'generic_rss': {
    type: 'rss',
    selectors: {
      title: 'title',
      description: 'description',
      date: 'pubDate',
      link: 'link'
    }
  }
};

export class UniversalScraper {
  private userAgent = 'Helix-Regulatory-Intelligence/3.0 (Medical Device Compliance Platform)';
  
  /**
   * Fetch and parse updates from any configured data source
   */
  async scrapeSource(source: DataSource, maxResults: number = 50): Promise<ScrapedUpdate[]> {
    if (!source.url) return [];
    
    const config = SCRAPER_CONFIGS[source.id] || this.detectStrategyFromUrl(source.url);
    
    console.log(`[Scraper] Processing ${source.name} (${config.type})`);
    
    try {
      switch (config.type) {
        case 'rss':
          return await this.scrapeRSS(source, config, maxResults);
        case 'html':
          return await this.scrapeHTML(source, config, maxResults);
        case 'api':
          return await this.scrapeAPI(source, config, maxResults);
        case 'xml':
          return await this.scrapeXML(source, config, maxResults);
        default:
          console.warn(`[Scraper] No strategy for ${source.name}, attempting generic HTML`);
          return await this.scrapeGenericHTML(source, maxResults);
      }
    } catch (error: any) {
      console.error(`[Scraper] Failed to process ${source.name}:`, error.message);
      return [];
    }
  }
  
  /**
   * RSS Feed Parser
   */
  private async scrapeRSS(source: DataSource, config: ScraperStrategy, maxResults: number): Promise<ScrapedUpdate[]> {
    if (!source.url) return [];
    
    const response = await axios.get(source.url, {
      headers: { 'User-Agent': this.userAgent },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data, { xmlMode: true });
    const updates: ScrapedUpdate[] = [];
    
    $('item, entry').slice(0, maxResults).each((_, element) => {
      const $item = $(element);
      const title = $item.find('title').text().trim();
      const description = $item.find('description, summary, content').first().text().trim();
      const dateStr = $item.find('pubDate, published, updated').first().text();
      const url = $item.find('link').text() || $item.find('link').attr('href') || source.url;
      
      if (title) {
        updates.push({
          title: this.cleanText(title),
          description: this.cleanHTML(description),
          published_date: this.parseDate(dateStr),
          url: url || source.url || '',
          source_id: source.id,
          jurisdiction: source.country || undefined,
          document_type: this.inferDocumentType(source.type),
          metadata: { raw_date: dateStr },
          hashedTitle: this.hashTitle(title)
        });
      }
    });
    
    return updates;
  }
  
  /**
   * HTML Scraper with CSS selectors
   */
  private async scrapeHTML(source: DataSource, config: ScraperStrategy, maxResults: number): Promise<ScrapedUpdate[]> {
    if (!source.url) return [];
    
    const response = await axios.get(source.url, {
      headers: { 'User-Agent': this.userAgent },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const updates: ScrapedUpdate[] = [];
    
    if (!config.selectors?.container) {
      return await this.scrapeGenericHTML(source, maxResults);
    }
    
    $(config.selectors.container).slice(0, maxResults).each((_, element) => {
      const $el = $(element);
      const selectors = config.selectors!;
      
      const title = selectors.title ? $el.find(selectors.title).text().trim() : '';
      const description = selectors.description ? $el.find(selectors.description).text().trim() : '';
      const dateStr = selectors.date ? $el.find(selectors.date).text().trim() : '';
      const link = selectors.link ? $el.find(selectors.link).attr('href') : '';
      const reference = selectors.reference ? $el.find(selectors.reference).text().trim() : undefined;
      
      if (title) {
        const finalUrl = link && source.url ? new URL(link, source.url).href : (source.url || '');
        updates.push({
          title: this.cleanText(title),
          description: this.cleanText(description) || title,
          published_date: this.parseDate(dateStr),
          url: finalUrl,
          source_id: source.id,
          reference_number: reference,
          jurisdiction: source.country || undefined,
          document_type: this.inferDocumentType(source.type),
          hashedTitle: this.hashTitle(title)
        });
      }
    });
    
    return updates;
  }
  
  /**
   * REST API Parser
   */
  private async scrapeAPI(source: DataSource, config: ScraperStrategy, maxResults: number): Promise<ScrapedUpdate[]> {
    if (!source.url) return [];
    
    const apiConfig = config.apiConfig!;
    
    const response = await axios({
      method: apiConfig.method,
      url: source.url,
      headers: {
        'User-Agent': this.userAgent,
        ...apiConfig.headers
      },
      params: apiConfig.params,
      timeout: 20000
    });
    
    let data = response.data;
    
    // Navigate to actual data array using dataPath
    if (apiConfig.dataPath) {
      const path = apiConfig.dataPath.split('.');
      for (const key of path) {
        data = data?.[key];
      }
    }
    
    if (!Array.isArray(data)) {
      console.warn(`[Scraper] API response not an array for ${source.name}`);
      return [];
    }
    
    const updates: ScrapedUpdate[] = [];
    
    data.slice(0, maxResults).forEach((item: any) => {
      // Flexible field mapping for various API structures
      const title = item.title || item.name || item.subject || item.description || 'Untitled';
      const description = item.description || item.abstract || item.summary || item.content || '';
      const dateStr = item.published_date || item.date || item.created_at || item.publication_date || new Date().toISOString();
      const url = item.url || item.link || item.href || source.url;
      const reference = item.reference_number || item.reference || item.id || item.case_number || item.patent_number;
      
      updates.push({
        title: this.cleanText(title),
        description: this.cleanText(description),
        published_date: this.parseDate(dateStr),
        url: url,
        source_id: source.id,
        reference_number: reference,
        jurisdiction: item.jurisdiction || source.country,
        status: item.status,
        document_type: item.document_type || this.inferDocumentType(source.type),
        metadata: item,
        hashedTitle: this.hashTitle(title)
      });
    });
    
    return updates;
  }
  
  /**
   * XML Feed Parser
   */
  private async scrapeXML(source: DataSource, config: ScraperStrategy, maxResults: number): Promise<ScrapedUpdate[]> {
    // XML is often similar to RSS, reuse RSS logic
    return await this.scrapeRSS(source, config, maxResults);
  }
  
  /**
   * Generic HTML fallback - attempts intelligent extraction
   */
  private async scrapeGenericHTML(source: DataSource, maxResults: number): Promise<ScrapedUpdate[]> {
    if (!source.url) return [];
    
    const response = await axios.get(source.url, {
      headers: { 'User-Agent': this.userAgent },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const updates: ScrapedUpdate[] = [];
    
    // Try common patterns: news articles, list items, table rows
    const candidates = $('article, .news-item, .update-item, li, tr').slice(0, maxResults * 2);
    
    candidates.each((_, element) => {
      const $el = $(element);
      
      // Find title candidates
      const titleEl = $el.find('h1, h2, h3, h4, .title, .heading').first();
      const title = titleEl.text().trim();
      
      if (!title || title.length < 10) return;
      
      // Find description
      const descEl = $el.find('p, .description, .summary, .abstract').first();
      const description = descEl.text().trim() || title;
      
      // Find date
      const dateEl = $el.find('time, .date, .published').first();
      const dateStr = dateEl.attr('datetime') || dateEl.text().trim() || new Date().toISOString();
      
      // Find link
      const linkEl = $el.find('a').first();
      const link = linkEl.attr('href') || source.url || '';
      
      const finalUrl = source.url ? new URL(link, source.url).href : link;
      
      updates.push({
        title: this.cleanText(title),
        description: this.cleanText(description),
        published_date: this.parseDate(dateStr),
        url: finalUrl,
        source_id: source.id,
        jurisdiction: source.country || undefined,
        document_type: this.inferDocumentType(source.type),
        hashedTitle: this.hashTitle(title)
      });
    });
    
    return updates.slice(0, maxResults);
  }
  
  /**
   * Detect strategy from URL patterns
   */
  private detectStrategyFromUrl(url: string): ScraperStrategy {
    const lower = url.toLowerCase();
    
    if (lower.includes('/rss') || lower.includes('/feed') || lower.includes('.xml')) {
      return SCRAPER_CONFIGS.generic_rss;
    }
    
    if (lower.includes('/api/') || lower.includes('.json')) {
      return {
        type: 'api',
        apiConfig: {
          method: 'GET',
          dataPath: 'data'
        }
      };
    }
    
    return { type: 'html', selectors: { title: 'h1, h2, h3' } };
  }
  
  /**
   * Utilities
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
  
  private cleanHTML(html: string): string {
    const $ = cheerio.load(html);
    return $.text().trim();
  }
  
  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    
    const parsed = new Date(dateStr);
    
    // If invalid, try common EU formats: DD.MM.YYYY, DD/MM/YYYY
    if (isNaN(parsed.getTime())) {
      const euMatch = dateStr.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
      if (euMatch) {
        return new Date(`${euMatch[3]}-${euMatch[2]}-${euMatch[1]}`);
      }
      return new Date();
    }
    
    return parsed;
  }
  
  private hashTitle(title: string): string {
    return crypto.createHash('sha256').update(title.toLowerCase().trim()).digest('hex');
  }
  
  private inferDocumentType(sourceType: string): string {
    const typeMap: Record<string, string> = {
      'regulatory': 'Regulatory Submission',
      'patents': 'Patent Application',
      'legal': 'Court Decision',
      'standards': 'Technical Standard',
      'safety': 'Safety Notice',
      'news': 'Industry Update',
      'research': 'Clinical Study'
    };
    
    return typeMap[sourceType] || 'General Update';
  }
}

export const universalScraper = new UniversalScraper();
