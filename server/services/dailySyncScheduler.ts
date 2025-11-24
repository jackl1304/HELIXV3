import { liveDataSourcesService } from './liveDataSourcesService';
import { fdaOpenApiService } from './fdaOpenApiService';
import { fdaPMAService } from './fdaPMAService';
import { fdaEnforcementService } from './fdaEnforcementService';
import { emaEparService } from './emaEparService';
import { healthCanadaMDALLService } from './healthCanadaMDALLService';
import { webScrapingService } from './webScrapingService';
import { syncAllPatentSources } from './patentService';
import { legalCaseCollector } from './legalCaseCollector';
import { storage } from '../storage';
import { Logger } from './logger.service';

const logger = new Logger('DailySyncScheduler');

export class DailySyncScheduler {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private readonly SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly IMMEDIATE_SYNC_ON_START = process.env.REG_AUTO_ENABLED !== 'false';

  async startScheduledSync(): Promise<void> {
    logger.info('Starting daily sync scheduler...');

    if (this.IMMEDIATE_SYNC_ON_START) {
      logger.info('Running immediate sync on startup...');
      await this.runCompleteSyncCycle();
    } else {
      logger.info('REG_AUTO_ENABLED=false -> Skipping immediate startup sync');
    }

    this.syncInterval = setInterval(async () => {
      await this.runCompleteSyncCycle();
    }, this.SYNC_INTERVAL_MS);

    logger.info(`Daily sync scheduled every ${this.SYNC_INTERVAL_MS / 1000 / 60 / 60} hours`);
  }

  async runCompleteSyncCycle(): Promise<void> {
    if (process.env.REG_AUTO_ENABLED === 'false') {
      logger.info('REG_AUTO_ENABLED=false -> Full sync cycle skipped');
      return;
    }
    if (this.isSyncing) {
      logger.warn('Sync already in progress, skipping this cycle');
      return;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      logger.info('========================================');
      logger.info('Starting complete data synchronization cycle');
      logger.info('========================================');

      await liveDataSourcesService.initializeLiveDataSources();

      logger.info('[Sync Phase 1/6] Syncing FDA data sources...');
      try {
        const fda510k = await fdaOpenApiService.collect510kDevices(100);
        logger.info(`FDA 510(k): Collected ${fda510k.length} devices`);

        const fdaPMA = await fdaPMAService.collectPMAApprovals(50);
        logger.info(`FDA PMA: Collected ${fdaPMA.length} PMA approvals`);

        const fdaRecalls = await fdaOpenApiService.collectRecalls(50);
        logger.info(`FDA Recalls (openAPI): Collected ${fdaRecalls.length} recalls`);

        const fdaEnforcement = await fdaEnforcementService.collectEnforcementActions(50);
        logger.info(`FDA Enforcement: Collected ${fdaEnforcement.length} enforcement actions`);
      } catch (fdaError) {
        logger.error('FDA sync encountered errors:', { error: fdaError });
      }

      logger.info('[Sync Phase 2/6] Syncing EMA data sources...');
      try {
        const emaMedicines = await emaEparService.collectMedicines(50);
        logger.info(`EMA EPAR: Collected ${emaMedicines.length} medicines`);
      } catch (emaError) {
        logger.error('EMA sync encountered errors:', { error: emaError });
      }

      logger.info('[Sync Phase 3/6] Syncing Health Canada data sources...');
      try {
        const canadaDevices = await healthCanadaMDALLService.collectActiveDevices(50);
        logger.info(`Health Canada MDALL: Collected ${canadaDevices.length} devices`);
      } catch (canadaError) {
        logger.error('Health Canada sync encountered errors:', { error: canadaError });
      }

      logger.info('[Sync Phase 4/6] Syncing old live data sources... TEMPORARILY DISABLED');
      logger.info('Phase 4 disabled to reduce log noise during Phase 5 debugging');

      logger.info('[Sync Phase 5/6] Syncing global patents from USPTO, WIPO, EPO, SureChemBL...');
      try {
        const patentStats = await syncAllPatentSources();
        logger.info(`Patents: Found ${patentStats.totalPatentsFound}, Synced ${patentStats.totalPatentsSynced}`, {
          errors: patentStats.errors.length
        });
      } catch (patentError) {
        logger.error('Patent sync encountered errors:', { error: patentError });
      }

      logger.info('[Sync Phase 6/6] Web Scraping: TGA, MHRA, Swissmedic, BfArM...');
      try {
        const scrapingResult = await webScrapingService.scrapeAllSources();
        logger.info(`Web Scraping: ${scrapingResult.successful}/${scrapingResult.total} sources successful`);
        logger.info(`Web Scraping: Collected ${scrapingResult.updates.length} total updates`);

        for (const update of scrapingResult.updates) {
          try {
            await storage.createRegulatoryUpdate({
              title: update.title,
              description: update.description,
              sourceId: update.sourceId,
              documentUrl: update.documentUrl,
              publishedDate: update.publishedDate,
              jurisdiction: update.jurisdiction,
              type: 'regulation',
              category: update.category || 'general',
              language: update.language || 'en',
              tags: [],
            });
          } catch (storeError) {
            logger.error(`Failed to store scraped update "${update.title}":`, { error: storeError });
          }
        }
      } catch (scrapingError) {
        logger.error('Web scraping sync encountered errors:', { error: scrapingError });
      }

      logger.info('[Sync Phase 7/7] Legal Cases: FDA Enforcement, CourtListener, EU Curia...');
      try {
        const legalResult = await legalCaseCollector.collectAllLegalCases();
        logger.info(`Legal Cases: Collected ${legalResult.totalCollected}, Stored ${legalResult.totalStored}`, {
          errors: legalResult.errors.length
        });
        if (legalResult.errors.length > 0) {
          logger.warn(`Legal case collection errors: ${legalResult.errors.join(', ')}`);
        }
      } catch (legalError) {
        logger.error('Legal case sync encountered errors:', { error: legalError });
      }

      logger.info('[Final Phase] Sync cycle complete');

      const duration = (Date.now() - startTime) / 1000;
      logger.info('========================================');
      logger.info(`✅ SYNC CYCLE COMPLETED IN ${duration.toFixed(2)}s`);
      logger.info('========================================');

    } catch (error) {
      logger.error('Complete sync cycle failed:', { error });
    } finally {
      this.isSyncing = false;
    }
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Daily sync scheduler stopped');
    }
  }

  async forceSyncNow(): Promise<void> {
    logger.info('Force sync triggered manually');
    await this.runCompleteSyncCycle();
  }

  getSyncStatus(): { isActive: boolean; isSyncing: boolean } {
    return {
      isActive: this.syncInterval !== null,
      isSyncing: this.isSyncing
    };
  }
}

export const dailySyncScheduler = new DailySyncScheduler();
