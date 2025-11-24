/**
 * Global Patent Data Collection Service
 * Harvests patents from USPTO, EPO/Espacenet, WIPO, and SureChemBL
 * Focus: Medtech, Pharmaceutical, Medical Devices
 */

import axios from 'axios';
import { db } from '../storage';
import { patents } from '../../shared/schema';
import { Logger } from './logger.service';

const logger = new Logger('PatentService');

interface PatentRecord {
  publicationNumber: string;
  title: string;
  abstract: string;
  applicant: string;
  inventors: string[];
  publicationDate: Date;
  filingDate: Date;
  status: 'granted' | 'pending' | 'abandoned' | 'expired';
  jurisdiction: string;
  ipcCodes: string[];
  cpcCodes: string[];
  forwardCitations: number;
  backwardCitations: number;
  documentUrl: string;
  patentFamily: string[];
  therapeuticArea?: string;
  deviceType?: string;
  chemicalStructure?: string;
  source: 'USPTO' | 'EPO' | 'WIPO' | 'SureChemBL';
}

// ============================================================================
// USPTO PATENTSVIEW API (US Patents)
// ============================================================================

async function harvestUSPTOPatents(searchTerm: string): Promise<PatentRecord[]> {
  try {
    logger.info('Harvesting USPTO patents', { searchTerm });

    const results: PatentRecord[] = [];
    
    // Query USPTO PatentsView API
    // Free API: https://patentsview.org/api/patents/query
    const queries = [
      { q: `{"patent_title": {"contains": "${searchTerm}"},"patent_type":"utility"}` },
      { q: `{"ipc_title": {"contains": "${searchTerm}"}}` },
      { q: `{"cpc_title": {"contains": "${searchTerm}"}}` }
    ];

    for (const query of queries) {
      try {
        const response = await axios.get('https://patentsview.org/api/patents/query', {
          params: {
            ...query,
            f: ['patent_num', 'patent_title', 'patent_abstract', 'assignee_organization', 'inventor_first_name', 'patent_date', 'patent_type'],
            o: '{"per_page": 25}',
            format: 'json'
          },
          timeout: 10000
        });

        if (response.data?.patents) {
          results.push(...response.data.patents.map((p: any) => ({
            publicationNumber: p.patent_num,
            title: p.patent_title,
            abstract: p.patent_abstract || '',
            applicant: p.assignee_organization || 'Unknown',
            inventors: [p.inventor_first_name].filter(Boolean),
            publicationDate: new Date(p.patent_date || Date.now()),
            filingDate: new Date(),
            status: 'granted' as const,
            jurisdiction: 'US',
            ipcCodes: [],
            cpcCodes: [],
            forwardCitations: 0,
            backwardCitations: 0,
            documentUrl: `https://patents.google.com/patent/US${p.patent_num}`,
            patentFamily: [],
            source: 'USPTO' as const
          })));
        }
      } catch (error: any) {
        logger.warn('USPTO query failed', { query, error: error.message });
      }
    }

    logger.info('USPTO harvest complete', { count: results.length });
    return results;
  } catch (error: any) {
    logger.error('USPTO harvest error', { error: error.message });
    return [];
  }
}

// ============================================================================
// WIPO PATENTSCOPE API (International Patents)
// ============================================================================

async function harvestWIPOPatents(searchTerm: string): Promise<PatentRecord[]> {
  try {
    logger.info('Harvesting WIPO patents', { searchTerm });

    const results: PatentRecord[] = [];

    // WIPO Patentscope SOAP API - Free access
    const keywords = ['medtech', 'medical device', 'pharmaceutical', 'drug', 'diagnostic', 'prosthetic', 'implant'];
    const sanitizedTerm = searchTerm.replace(/[^a-zA-Z0-9\s]/g, '');

    for (const keyword of keywords) {
      try {
        const response = await axios.get('https://patentscope.wipo.int/search/en/result.json', {
          params: {
            query: `${sanitizedTerm} AND (${keyword})`,
            resultSize: 10,
            sortKey: 'Relevance'
          },
          timeout: 10000
        });

        if (response.data?.results) {
          results.push(...response.data.results.map((p: any) => ({
            publicationNumber: p.publicationNumber || p.pctNumber,
            title: p.title,
            abstract: p.abstract || '',
            applicant: p.applicant?.[0]?.name || 'Unknown',
            inventors: p.inventor?.map((i: any) => i.name) || [],
            publicationDate: new Date(p.publicationDate || Date.now()),
            filingDate: new Date(p.filingDate || Date.now()),
            status: p.status || 'pending',
            jurisdiction: 'WO', // WIPO/PCT
            ipcCodes: p.ipcCodes || [],
            cpcCodes: [],
            forwardCitations: 0,
            backwardCitations: 0,
            documentUrl: `https://patentscope.wipo.int/search/en/detail.jsf?docId=${p.id}`,
            patentFamily: p.familyMembers || [],
            therapeuticArea: p.therapeuticArea,
            source: 'WIPO' as const
          })));
        }
      } catch (error: any) {
        logger.warn('WIPO query failed', { keyword, error: error.message });
      }
    }

    logger.info('WIPO harvest complete', { count: results.length });
    return results;
  } catch (error: any) {
    logger.error('WIPO harvest error', { error: error.message });
    return [];
  }
}

// ============================================================================
// EPO ESPACENET API (European + Global Patents)
// ============================================================================

async function harvestEPOPatents(searchTerm: string): Promise<PatentRecord[]> {
  try {
    logger.info('Harvesting EPO patents', { searchTerm });

    const results: PatentRecord[] = [];

    // EPO OPS API - Free with registration
    // Classification codes for medtech: A61 (medical)
    const queries = [
      `(${searchTerm} OR medtech) AND ipc:A61B`, // Medical devices
      `(${searchTerm} OR pharmaceutical) AND ipc:A61K`, // Pharmaceutical
      `(${searchTerm} OR diagnostic) AND cpc:G01N`, // Diagnostics
    ];

    for (const query of queries) {
      try {
        // Using Espacenet public search as fallback (simulated)
        const response = await axios.get('https://worldwide.espacenet.com/api/search', {
          params: {
            q: query,
            l: 25,
            format: 'json'
          },
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.data?.results) {
          results.push(...response.data.results.map((p: any) => ({
            publicationNumber: p.publicationNumber,
            title: p.title,
            abstract: p.abstract || '',
            applicant: p.applicant || 'Unknown',
            inventors: p.inventors || [],
            publicationDate: new Date(p.publicationDate || Date.now()),
            filingDate: new Date(p.filingDate || Date.now()),
            status: p.status || 'pending',
            jurisdiction: p.jurisdiction || 'EP',
            ipcCodes: p.ipc || [],
            cpcCodes: p.cpc || [],
            forwardCitations: p.forwardCitations || 0,
            backwardCitations: p.citations || 0,
            documentUrl: `https://worldwide.espacenet.com/publicationDetails/biblio?${p.publicationNumber}`,
            patentFamily: p.family || [],
            source: 'EPO' as const
          })));
        }
      } catch (error: any) {
        logger.warn('EPO query failed', { query, error: error.message });
        // Continue with next query on error
      }
    }

    logger.info('EPO harvest complete', { count: results.length });
    return results;
  } catch (error: any) {
    logger.error('EPO harvest error', { error: error.message });
    return [];
  }
}

// ============================================================================
// SURECHEMBL API (Chemical Patent Database)
// ============================================================================

async function harvestSureChemBLPatents(searchTerm: string): Promise<PatentRecord[]> {
  try {
    logger.info('Harvesting SureChemBL patents', { searchTerm });

    const results: PatentRecord[] = [];

    // SureChemBL REST API - Free for chemical structure searches
    try {
      const response = await axios.get('https://www.surechembl.org/api/data/search/surechembl/', {
        params: {
          q: searchTerm,
          format: 'json',
          limit: 20
        },
        timeout: 10000
      });

      if (response.data?.molecules) {
        results.push(...response.data.molecules.map((m: any) => ({
          publicationNumber: m.patent_id || `SureChemBL_${m.id}`,
          title: `Patent containing: ${searchTerm}`,
          abstract: m.description || '',
          applicant: m.source || 'Unknown',
          inventors: [],
          publicationDate: new Date(),
          filingDate: new Date(),
          status: 'granted' as const,
          jurisdiction: 'Global',
          ipcCodes: [],
          cpcCodes: [],
          forwardCitations: 0,
          backwardCitations: 0,
          documentUrl: `https://www.surechembl.org/chemical/${m.id}`,
          patentFamily: [],
          chemicalStructure: m.chembl_id,
          source: 'SureChemBL' as const
        })));
      }
    } catch (error: any) {
      logger.warn('SureChemBL query failed', { error: error.message });
    }

    logger.info('SureChemBL harvest complete', { count: results.length });
    return results;
  } catch (error: any) {
    logger.error('SureChemBL harvest error', { error: error.message });
    return [];
  }
}

// ============================================================================
// Main Patent Sync Function
// ============================================================================

export async function syncAllPatentSources(): Promise<{
  totalPatentsFound: number;
  totalPatentsSynced: number;
  errors: string[];
}> {
  const stats = {
    totalPatentsFound: 0,
    totalPatentsSynced: 0,
    errors: [] as string[]
  };

  try {
    logger.info('Starting global patent sync cycle');

    const searchTerms = [
      'medical device',
      'pharmaceutical',
      'medtech',
      'implant',
      'diagnostic',
      'prosthetic',
      'surgical',
      'biotech',
      'drug delivery'
    ];

    // Harvest from all sources
    const allPatents: PatentRecord[] = [];

    // Parallel harvesting
    const [usptPatents, wipoPatents, epoPatents, surechemPatents] = await Promise.allSettled([
      harvestUSPTOPatents(searchTerms.join(' OR ')),
      harvestWIPOPatents(searchTerms.join(' AND ')),
      harvestEPOPatents(searchTerms.join(' ')),
      harvestSureChemBLPatents(searchTerms[0])
    ]).then(results => results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      stats.errors.push(`Patent source ${i + 1} failed`);
      return [];
    }));

    allPatents.push(...usptPatents, ...wipoPatents, ...epoPatents, ...surechemPatents);
    stats.totalPatentsFound = allPatents.length;

    if (allPatents.length === 0) {
      logger.warn('No patents found in any source');
      return stats;
    }

    // Deduplicate by publication number
    const uniquePatents = Array.from(new Map(
      allPatents.map(p => [p.publicationNumber, p])
    ).values());

    // Insert into database
    for (const patent of uniquePatents) {
      try {
        await db.insert(patents).values({
          publicationNumber: patent.publicationNumber,
          title: patent.title,
          abstract: patent.abstract,
          applicant: patent.applicant,
          inventors: patent.inventors,
          publicationDate: patent.publicationDate,
          filingDate: patent.filingDate,
          status: patent.status,
          jurisdiction: patent.jurisdiction,
          ipcCodes: patent.ipcCodes,
          cpcCodes: patent.cpcCodes,
          forwardCitations: patent.forwardCitations,
          backwardCitations: patent.backwardCitations,
          documentUrl: patent.documentUrl,
          patentFamily: patent.patentFamily,
          therapeuticArea: patent.therapeuticArea,
          deviceType: patent.deviceType,
          chemicalStructure: patent.chemicalStructure,
          source: patent.source
        }).onConflictDoNothing();

        stats.totalPatentsSynced++;
      } catch (error: any) {
        stats.errors.push(`Failed to insert patent ${patent.publicationNumber}: ${error.message}`);
      }
    }

    logger.info('Patent sync cycle complete', {
      found: stats.totalPatentsFound,
      synced: stats.totalPatentsSynced,
      errors: stats.errors.length
    });

    return stats;
  } catch (error: any) {
    logger.error('Patent sync error', { error: error.message });
    stats.errors.push(error.message);
    return stats;
  }
}

export { PatentRecord };
