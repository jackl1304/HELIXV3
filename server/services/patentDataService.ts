import { Logger } from './logger.service';
import fetch from 'node-fetch';

const logger = new Logger('PatentDataService');

export interface RealPatent {
  id: string;
  patentNumber: string;
  title: string;
  abstract: string;
  applicant: string;
  inventors: string;
  jurisdiction: string;
  filingDate: string;
  publicationDate: string;
  grantDate: string | null;
  status: string;
  deviceType: string;
  riskClass: string;
  source: string;
}

// 1. PatentsView API (USA) - kostenlos, 100M+ US Patents
export async function fetchUSPatents(limit: number = 50): Promise<RealPatent[]> {
  try {
    const query = {
      q: {
        "_text_all": { value: "medical device diagnostic" }
      },
      f: [
        "patent_number",
        "patent_title", 
        "patent_abstract",
        "assignee_organization",
        "inventor_name_first",
        "inventor_name_last",
        "patent_date",
        "patent_type"
      ],
      o: { per_page: limit, page: 1 }
    };

    const response = await fetch('https://api.patentsview.org/patents/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`PatentsView API error: ${response.status}`);
    }

    const data: any = await response.json();
    const patents: RealPatent[] = [];

    if (data.patents) {
      for (const p of data.patents.slice(0, limit)) {
        patents.push({
          id: p.patent_number,
          patentNumber: `US${p.patent_number}`,
          title: p.patent_title || 'Untitled',
          abstract: p.patent_abstract || 'No abstract available',
          applicant: p.assignee_organization || 'Unknown',
          inventors: p.inventor_name_first ? `${p.inventor_name_first} ${p.inventor_name_last}` : 'Unknown',
          jurisdiction: 'US',
          filingDate: p.patent_date || new Date().toISOString(),
          publicationDate: p.patent_date || new Date().toISOString(),
          grantDate: p.patent_date || null,
          status: 'granted',
          deviceType: 'Medical Device',
          riskClass: 'Class II',
          source: 'USPTO PatentsView'
        });
      }
    }

    logger.info(`US Patents: ${patents.length} fetched`);
    return patents;
  } catch (error) {
    logger.error('PatentsView API error', { error });
    return [];
  }
}

// 2. The Lens API (Global) - 140M+ patents worldwide
export async function fetchGlobalPatents(limit: number = 50): Promise<RealPatent[]> {
  try {
    // The Lens offers public search without strict auth for limited queries
    const response = await fetch('https://www.lens.org/api/patent/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
      body: JSON.stringify({
        search_text: "medical device diagnostic imaging",
        page: { size: limit, number: 1 }
      })
    });

    if (!response.ok) {
      logger.warn('The Lens API request failed, returning fallback');
      return [];
    }

    const data: any = await response.json();
    const patents: RealPatent[] = [];

    if (data.data) {
      for (const p of data.data.slice(0, limit)) {
        const jurisdiction = p.jurisdiction?.[0] || 'Global';
        patents.push({
          id: p.publication_key || p.patent_number,
          patentNumber: p.publication_key || p.patent_number,
          title: p.title || 'Untitled',
          abstract: p.abstract || 'No abstract available',
          applicant: p.applicant_organization || 'Unknown',
          inventors: p.inventors?.map((i: any) => i.name).join('; ') || 'Unknown',
          jurisdiction: jurisdiction,
          filingDate: p.filing_date || new Date().toISOString(),
          publicationDate: p.publication_date || new Date().toISOString(),
          grantDate: p.grant_date || null,
          status: p.legal_status || 'pending',
          deviceType: 'Medical Device',
          riskClass: 'Class II',
          source: 'The Lens Global Patents'
        });
      }
    }

    logger.info(`Global Patents (Lens): ${patents.length} fetched`);
    return patents;
  } catch (error) {
    logger.error('The Lens API error', { error });
    return [];
  }
}

// 3. EPO OPS API (Europe) - European Patent Office
export async function fetchEuropeanPatents(limit: number = 50): Promise<RealPatent[]> {
  try {
    // EPO OPS requires registration but is free
    // Using public endpoint for demonstration
    const response = await fetch(
      `https://ops.epo.org/3.2/rest-services/published-data/search?q=ti%3D%22medical%20device%22&Range=1-${limit}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HELIX-PatentSystem/1.0'
        },
        timeout: 30000
      }
    );

    if (!response.ok) {
      logger.warn('EPO API request failed');
      return [];
    }

    const data: any = await response.json();
    const patents: RealPatent[] = [];

    if (data['ops:world-patent-data']) {
      const results = data['ops:world-patent-data']['ops:biblio-search']?.['ops:search-result'] || [];
      const resultArray = Array.isArray(results) ? results : [results];

      for (const p of resultArray.slice(0, limit)) {
        patents.push({
          id: p['@id'] || `EP-${Math.random()}`,
          patentNumber: p['publication-reference']?.['document-id']?.[0]?.['doc-number'] || 'Unknown',
          title: p['biblio']?.['title'] || 'Untitled',
          abstract: p['biblio']?.['abstract'] || 'No abstract available',
          applicant: p['biblio']?.['applicant']?.[0]?.['orgname'] || 'Unknown',
          inventors: p['biblio']?.['inventor']?.map((i: any) => i.name).join('; ') || 'Unknown',
          jurisdiction: 'EU',
          filingDate: p['biblio']?.['filing-date'] || new Date().toISOString(),
          publicationDate: p['biblio']?.['publication-date'] || new Date().toISOString(),
          grantDate: p['biblio']?.['grant-date'] || null,
          status: 'granted',
          deviceType: 'Medical Device',
          riskClass: 'Class II',
          source: 'EPO European Patent Office'
        });
      }
    }

    logger.info(`European Patents (EPO): ${patents.length} fetched`);
    return patents;
  } catch (error) {
    logger.error('EPO API error', { error });
    return [];
  }
}

// Main function: Sammle echte Patente von ALLEN Quellen
export async function fetchAllRealPatents(paginSize: number = 25): Promise<RealPatent[]> {
  logger.info('Starting real patent data collection from worldwide sources');
  
  try {
    const [usPatents, globalPatents, epPatents] = await Promise.all([
      fetchUSPatents(paginSize),
      fetchGlobalPatents(paginSize),
      fetchEuropeanPatents(paginSize)
    ]);

    const allPatents = [
      ...usPatents,
      ...globalPatents,
      ...epPatents
    ];

    // Deduplicate by patent number
    const uniquePatents = Array.from(
      new Map(allPatents.map(p => [p.patentNumber, p])).values()
    );

    logger.info(`Total unique real patents collected: ${uniquePatents.length}`);
    return uniquePatents;
  } catch (error) {
    logger.error('Error collecting real patents', { error });
    return [];
  }
}
