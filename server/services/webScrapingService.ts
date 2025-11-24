import axios from 'axios';
import * as cheerio from 'cheerio';
import { Logger } from './logger.service';

const logger = new Logger('WebScrapingService');

export interface ScrapedUpdate {
  title: string;
  description: string;
  documentUrl: string;
  publishedDate: Date;
  jurisdiction: string;
  sourceId: string;
  category?: string;
  language?: string;
}

class WebScrapingService {
  private readonly USER_AGENT = 'Helix-Regulatory-Intelligence/2.0 (MedTech Compliance Platform)';
  private readonly DEFAULT_TIMEOUT = 15000;
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchHtmlWithRetry(url: string, maxRetries = this.DEFAULT_MAX_RETRIES): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`[Scraper] Fetching ${url} (attempt ${attempt}/${maxRetries})...`);
        
        const response = await axios.get(url, {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'User-Agent': this.USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
          },
        });
        
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.data;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`[Scraper] Attempt ${attempt} failed - ${lastError.message}`);
        
        if (attempt < maxRetries) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  async scrapeTGA(): Promise<ScrapedUpdate[]> {
    const url = 'https://www.tga.gov.au/news';
    const startTime = Date.now();
    
    try {
      logger.info('[Scraper] Starting TGA Australia scrape...');
      
      const html = await this.fetchHtmlWithRetry(url);
      const $ = cheerio.load(html);
      const updates: ScrapedUpdate[] = [];
      
      $('.views-row').each((_index, element) => {
        try {
          const $item = $(element);
          
          const title = $item.find('.views-field-title a, h3 a, .title a').first().text().trim();
          if (!title) return;
          
          let link = $item.find('.views-field-title a, h3 a, .title a').first().attr('href') || '';
          if (link && !link.startsWith('http')) {
            link = new URL(link, url).toString();
          }
          
          const description = $item.find('.views-field-body, .field-content, p').first().text().trim() || '';
          
          const dateText = $item.find('time, .date, .views-field-created').first().text().trim();
          const publishedDate = dateText ? new Date(dateText) : new Date();
          
          updates.push({
            title,
            description,
            documentUrl: link,
            publishedDate: isNaN(publishedDate.getTime()) ? new Date() : publishedDate,
            jurisdiction: 'Australia',
            sourceId: 'tga_australia',
            category: 'regulation',
            language: 'en',
          });
        } catch (error) {
          logger.error('[Scraper] TGA: Failed to parse item', { error });
        }
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`[Scraper] TGA: Extracted ${updates.length} updates in ${duration}s`);
      
      return updates;
    } catch (error) {
      logger.error('[Scraper] TGA failed:', { error });
      return [];
    }
  }

  async scrapeMHRA(): Promise<ScrapedUpdate[]> {
    const url = 'https://www.gov.uk/search/news-and-communications?organisations%5B%5D=medicines-and-healthcare-products-regulatory-agency&order=updated-newest';
    const startTime = Date.now();
    
    try {
      logger.info('[Scraper] Starting MHRA UK scrape...');
      
      const html = await this.fetchHtmlWithRetry(url);
      const $ = cheerio.load(html);
      const updates: ScrapedUpdate[] = [];
      
      $('li.gem-c-document-list__item').each((_index, element) => {
        try {
          const $item = $(element);
          
          const $titleLink = $item.find('.gem-c-document-list__item-title a').first();
          const title = $titleLink.text().trim();
          if (!title) return;
          
          let link = $titleLink.attr('href') || '';
          if (link && !link.startsWith('http')) {
            link = `https://www.gov.uk${link}`;
          }
          
          const description = $item.find('.gem-c-document-list__item-description').first().text().trim() || '';
          
          const $time = $item.find('.gem-c-document-list__attribute time').first();
          const dateText = $time.attr('datetime') || $time.text().trim();
          const publishedDate = dateText ? new Date(dateText) : new Date();
          
          updates.push({
            title,
            description,
            documentUrl: link,
            publishedDate: isNaN(publishedDate.getTime()) ? new Date() : publishedDate,
            jurisdiction: 'United Kingdom',
            sourceId: 'mhra_uk',
            category: 'regulation',
            language: 'en',
          });
        } catch (error) {
          logger.error('[Scraper] MHRA: Failed to parse item', { error });
        }
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`[Scraper] MHRA: Extracted ${updates.length} updates in ${duration}s`);
      
      return updates;
    } catch (error) {
      logger.error('[Scraper] MHRA failed:', { error });
      return [];
    }
  }

  async scrapeSwissmedic(): Promise<ScrapedUpdate[]> {
    const url = 'https://www.swissmedic.ch/swissmedic/en/home/news/mitteilungen.html';
    const startTime = Date.now();
    
    try {
      logger.info('[Scraper] Starting Swissmedic scrape...');
      
      const html = await this.fetchHtmlWithRetry(url);
      const $ = cheerio.load(html);
      const updates: ScrapedUpdate[] = [];
      
      $('.mod_newslist article, .ce_newslist article, article').each((_index, element) => {
        try {
          const $item = $(element);
          
          const title = $item.find('h2 a, h3 a, .ce_headline a, .title a').first().text().trim();
          if (!title) return;
          
          let link = $item.find('h2 a, h3 a, .ce_headline a, .title a').first().attr('href') || '';
          if (link && !link.startsWith('http')) {
            link = new URL(link, url).toString();
          }
          
          const description = $item.find('.ce_text, .teaser, p').first().text().trim() || '';
          
          const dateText = $item.find('time, .date, .info').first().text().trim();
          const publishedDate = dateText ? new Date(dateText) : new Date();
          
          updates.push({
            title,
            description,
            documentUrl: link,
            publishedDate: isNaN(publishedDate.getTime()) ? new Date() : publishedDate,
            jurisdiction: 'Switzerland',
            sourceId: 'swissmedic_ch',
            category: 'regulation',
            language: 'en',
          });
        } catch (error) {
          logger.error('[Scraper] Swissmedic: Failed to parse item', { error });
        }
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`[Scraper] Swissmedic: Extracted ${updates.length} updates in ${duration}s`);
      
      return updates;
    } catch (error) {
      logger.error('[Scraper] Swissmedic failed:', { error });
      return [];
    }
  }

  async scrapeBfArm(): Promise<ScrapedUpdate[]> {
    const url = 'https://www.bfarm.de/DE/Service/Presse/Pressemitteilungen/_node.html';
    const startTime = Date.now();
    
    try {
      logger.info('[Scraper] Starting BfArM Germany scrape...');
      
      const html = await this.fetchHtmlWithRetry(url);
      const $ = cheerio.load(html);
      const updates: ScrapedUpdate[] = [];
      
      $('.teaser, .teaserlist__item, article').each((_index, element) => {
        try {
          const $item = $(element);
          
          const title = $item.find('h2 a, h3 a, .teaser__headline a, .title a').first().text().trim();
          if (!title) return;
          
          let link = $item.find('h2 a, h3 a, .teaser__headline a, .title a').first().attr('href') || '';
          if (link && !link.startsWith('http')) {
            link = new URL(link, url).toString();
          }
          
          const description = $item.find('.teaser__text, .ce_text, p').first().text().trim() || '';
          
          const dateText = $item.find('time, .date, .teaser__date').first().text().trim();
          const publishedDate = dateText ? this.parseGermanDate(dateText) : new Date();
          
          updates.push({
            title,
            description,
            documentUrl: link,
            publishedDate,
            jurisdiction: 'Germany',
            sourceId: 'bfarm_de',
            category: 'regulation',
            language: 'de',
          });
        } catch (error) {
          logger.error('[Scraper] BfArM: Failed to parse item', { error });
        }
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`[Scraper] BfArM: Extracted ${updates.length} updates in ${duration}s`);
      
      return updates;
    } catch (error) {
      logger.error('[Scraper] BfArM failed:', { error });
      return [];
    }
  }

  async scrapeAllSources(): Promise<{
    total: number;
    successful: number;
    failed: number;
    updates: ScrapedUpdate[];
  }> {
    logger.info('[Scraper] Starting comprehensive web scraping sync...');
    
    const sources = [
      { name: 'MHRA UK', method: () => this.scrapeMHRA() },
    ];
    
    let successful = 0;
    let failed = 0;
    const allUpdates: ScrapedUpdate[] = [];
    
    for (const source of sources) {
      try {
        const updates = await source.method();
        
        if (updates.length > 0) {
          allUpdates.push(...updates);
          successful++;
          logger.info(`[Scraper] ${source.name}: ✓ ${updates.length} updates`);
        } else {
          failed++;
          logger.warn(`[Scraper] ${source.name}: ✗ No updates found`);
        }
        
        await this.delay(this.RETRY_DELAY);
      } catch (error) {
        failed++;
        logger.error(`[Scraper] ${source.name}: ✗ Failed`, { error });
      }
    }
    
    logger.info(`[Scraper] Sync completed: ${successful}/${sources.length} sources successful, ${allUpdates.length} total updates`);
    
    return {
      total: sources.length,
      successful,
      failed,
      updates: allUpdates,
    };
  }

  private parseGermanDate(dateStr: string): Date {
    const months: { [key: string]: number } = {
      'januar': 0, 'februar': 1, 'märz': 2, 'april': 3, 'mai': 4, 'juni': 5,
      'juli': 6, 'august': 7, 'september': 8, 'oktober': 9, 'november': 10, 'dezember': 11
    };
    
    const match = dateStr.match(/(\d{1,2})\.\s*(\w+)\s*(\d{4})/i);
    if (match) {
      const day = parseInt(match[1]);
      const monthName = match[2].toLowerCase();
      const year = parseInt(match[3]);
      const month = months[monthName];
      
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }
    
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
}

export const webScrapingService = new WebScrapingService();
