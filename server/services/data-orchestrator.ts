/**
 * Master Data Collection Orchestrator
 * Coordinates scraping across all 110+ sources with intelligent scheduling
 */

import { storage } from '../storage';
import { universalScraper } from './universal-scraper';
import { professionalFormatter } from './professional-formatter';
import { regulatoryUpdates } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface SyncResult {
  source_id: string;
  source_name: string;
  updates_found: number;
  updates_inserted: number;
  errors: string[];
  duration_ms: number;
}

interface SyncReport {
  started_at: Date;
  completed_at: Date;
  total_sources: number;
  successful_sources: number;
  failed_sources: number;
  total_updates_found: number;
  total_updates_inserted: number;
  results: SyncResult[];
}

export class DataCollectionOrchestrator {
  private syncInProgress = false;
  
  /**
   * Synchronize all active data sources
   */
  async syncAllSources(maxResultsPerSource: number = 50): Promise<SyncReport> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }
    
    this.syncInProgress = true;
    const report: SyncReport = {
      started_at: new Date(),
      completed_at: new Date(),
      total_sources: 0,
      successful_sources: 0,
      failed_sources: 0,
      total_updates_found: 0,
      total_updates_inserted: 0,
      results: []
    };
    
    try {
      console.log('[Orchestrator] Starting comprehensive data collection...');
      
      // Get all active sources
      const sources = await storage.getDataSources();
      const activeSources = sources.filter((s: any) => s.status === 'active');
      
      report.total_sources = activeSources.length;
      console.log(`[Orchestrator] Found ${activeSources.length} active sources`);
      
      // Process sources in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < activeSources.length; i += batchSize) {
        const batch = activeSources.slice(i, i + batchSize);
        
        console.log(`[Orchestrator] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(activeSources.length / batchSize)}`);
        
        const batchResults = await Promise.allSettled(
          batch.map((source: any) => this.syncSingleSource(source, maxResultsPerSource))
        );
        
        batchResults.forEach((result: any, idx: number) => {
          if (result.status === 'fulfilled') {
            report.results.push(result.value);
            report.successful_sources++;
            report.total_updates_found += result.value.updates_found;
            report.total_updates_inserted += result.value.updates_inserted;
          } else {
            const source = batch[idx];
            report.results.push({
              source_id: source.id,
              source_name: source.name,
              updates_found: 0,
              updates_inserted: 0,
              errors: [result.reason?.message || 'Unknown error'],
              duration_ms: 0
            });
            report.failed_sources++;
          }
        });
        
        // Small delay between batches
        if (i + batchSize < activeSources.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      report.completed_at = new Date();
      
      console.log(`[Orchestrator] Sync complete: ${report.successful_sources}/${report.total_sources} sources, ${report.total_updates_inserted} new updates`);
      
      return report;
      
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Sync a single data source
   */
  private async syncSingleSource(source: any, maxResults: number): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      source_id: source.id,
      source_name: source.name,
      updates_found: 0,
      updates_inserted: 0,
      errors: [],
      duration_ms: 0
    };
    
    try {
      console.log(`[Orchestrator] Scraping ${source.name}...`);
      
      // Scrape source
      const scrapedUpdates = await universalScraper.scrapeSource(source, maxResults);
      result.updates_found = scrapedUpdates.length;
      
      if (scrapedUpdates.length === 0) {
        console.log(`[Orchestrator] No updates found for ${source.name}`);
        result.duration_ms = Date.now() - startTime;
        return result;
      }
      
      console.log(`[Orchestrator] Found ${scrapedUpdates.length} updates from ${source.name}`);
      
      // Process and insert each update
      let inserted = 0;
      for (const scraped of scrapedUpdates) {
        try {
          // Check if already exists (by hashedTitle)
          const existingUpdates = await storage.getAllRegulatoryUpdates();
          const existing = existingUpdates.filter((u: any) => u.hashedTitle === scraped.hashedTitle);
          
          if (existing.length > 0) {
            continue; // Skip duplicate
          }
          
          // Format content professionally
          const formatted = professionalFormatter.formatUpdate(scraped);
          
          // Prepare for database insertion
          const updateData = {
            title: scraped.title,
            description: formatted.executive_summary,
            full_content: formatted.technical_details + '\n\n' + formatted.compliance_impact,
            published_date: scraped.published_date,
            url: scraped.url,
            source_id: scraped.source_id,
            reference_number: scraped.reference_number,
            jurisdiction: scraped.jurisdiction,
            status: scraped.status,
            document_type: scraped.document_type,
            hashedTitle: scraped.hashedTitle,
            metadata: {
              ...scraped.metadata,
              formatted: {
                actionable_insights: formatted.actionable_insights,
                risk_category: formatted.risk_category,
                affected_sectors: formatted.affected_sectors
              }
            },
            created_at: new Date(),
            updated_at: new Date()
          };
          
          await storage.createRegulatoryUpdate(updateData);
          inserted++;
          
        } catch (error: any) {
          console.error(`[Orchestrator] Failed to insert update "${scraped.title}":`, error.message);
          result.errors.push(`Insert failed: ${scraped.title} - ${error.message}`);
        }
      }
      
      result.updates_inserted = inserted;
      console.log(`[Orchestrator] Inserted ${inserted}/${scrapedUpdates.length} updates from ${source.name}`);
      
    } catch (error: any) {
      console.error(`[Orchestrator] Failed to sync ${source.name}:`, error.message);
      result.errors.push(error.message);
    }
    
    result.duration_ms = Date.now() - startTime;
    return result;
  }
  
  /**
   * Sync specific source types (e.g., only patents, only legal)
   */
  async syncSourcesByType(type: string, maxResults: number = 50): Promise<SyncReport> {
    console.log(`[Orchestrator] Starting sync for source type: ${type}`);
    
    const sources = await storage.getDataSources();
    const filteredSources = sources.filter((s: any) => s.type === type && s.status === 'active');
    
    return this.syncSpecificSources(filteredSources.map((s: any) => s.id), maxResults);
  }
  
  /**
   * Sync specific sources by ID
   */
  async syncSpecificSources(sourceIds: string[], maxResults: number = 50): Promise<SyncReport> {
    const sources = await storage.getDataSources();
    const targetSources = sources.filter((s: any) => sourceIds.includes(s.id) && s.status === 'active');
    
    if (targetSources.length === 0) {
      throw new Error('No valid sources found');
    }
    
    this.syncInProgress = true;
    const report: SyncReport = {
      started_at: new Date(),
      completed_at: new Date(),
      total_sources: targetSources.length,
      successful_sources: 0,
      failed_sources: 0,
      total_updates_found: 0,
      total_updates_inserted: 0,
      results: []
    };
    
    try {
      const results = await Promise.allSettled(
        targetSources.map((source: any) => this.syncSingleSource(source, maxResults))
      );
      
      results.forEach((result: any, idx: number) => {
        if (result.status === 'fulfilled') {
          report.results.push(result.value);
          report.successful_sources++;
          report.total_updates_found += result.value.updates_found;
          report.total_updates_inserted += result.value.updates_inserted;
        } else {
          const source = targetSources[idx];
          report.results.push({
            source_id: source.id,
            source_name: source.name,
            updates_found: 0,
            updates_inserted: 0,
            errors: [result.reason?.message || 'Unknown error'],
            duration_ms: 0
          });
          report.failed_sources++;
        }
      });
      
      report.completed_at = new Date();
      return report;
      
    } finally {
      this.syncInProgress = false;
    }
  }
}

export const dataOrchestrator = new DataCollectionOrchestrator();
