import axios from 'axios';
import { storage } from '../storage';
import { Logger } from './logger.service';

const logger = new Logger('PatentCollector');

interface PatentRecord {
  publicationNumber: string;
  title: string;
  abstract?: string;
  applicant?: string;
  inventors: string[];
  publicationDate?: string;
  filingDate?: string;
  status?: string;
  jurisdiction?: string;
  ipcCodes?: string[];
  cpcCodes?: string[];
  forwardCitations?: number;
  backwardCitations?: number;
  documentUrl?: string;
  source?: string;
}

export class PatentCollector {
  private readonly REQUEST_DELAY = 1500;
  private readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HelixPatentBot/1.0';

  // Helper: safe delay
  private delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  // USPTO Open Data Portal (patent.gov - kein Token erforderlich!)
  async collectUsptoOpenData(limit: number = 20): Promise<PatentRecord[]> {
    logger.info(`Collecting patents from USPTO Open Data Portal (limit: ${limit})...`);

    // USPTO PatentPublicData API endpoint
    const url = 'https://developer.uspto.gov/ibd-api/v1/application/grants';

    try {
      const response = await axios.get(url, {
        params: {
          searchText: 'medical device implant diagnostic surgical',
          start: 0,
          rows: limit
        },
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'application/json'
        },
        timeout: 25000
      });

      const patents: PatentRecord[] = [];
      const results = response.data?.response?.docs || response.data?.results || [];

      for (const doc of results) {
        try {
          if (!doc.patentNumber && !doc.publicationNumber) continue;

          const pubNum = doc.patentNumber || doc.publicationNumber;
          const inventors: string[] = [];
          if (doc.inventorName) {
            if (Array.isArray(doc.inventorName)) {
              inventors.push(...doc.inventorName);
            } else {
              inventors.push(doc.inventorName);
            }
          }

          const cpcCodes: string[] = [];
          if (doc.cpcClassificationCode) {
            if (Array.isArray(doc.cpcClassificationCode)) {
              cpcCodes.push(...doc.cpcClassificationCode);
            } else {
              cpcCodes.push(doc.cpcClassificationCode);
            }
          }

          patents.push({
            publicationNumber: pubNum,
            title: (doc.inventionTitle || doc.title || 'Untitled Patent').slice(0, 500),
            abstract: doc.abstractText || doc.abstract || undefined,
            applicant: doc.assigneeName || doc.applicantName || undefined,
            inventors,
            publicationDate: doc.grantDate || doc.publicationDate || undefined,
            filingDate: doc.filingDate || doc.applicationDate || undefined,
            status: 'granted',
            jurisdiction: 'US',
            cpcCodes,
            documentUrl: `https://patft.uspto.gov/netacgi/nph-Parser?patentnumber=${pubNum}`,
            source: 'USPTO Open Data'
          });
        } catch (parseError) {
          logger.error('Failed to parse USPTO patent', { error: parseError });
        }
      }

      logger.info(`USPTO Open Data: Collected ${patents.length} patents`);
      return patents;
    } catch (error) {
      logger.error('USPTO Open Data collection failed', { error: axios.isAxiosError(error) ? error.message : error });
      return [];
    }
  }

  async collectUSPatents(limit: number = 20): Promise<PatentRecord[]> {
    logger.info(`Collecting US patents from PatentsView API (limit: ${limit})...`);

    const keywords = [
      'medical device',
      'in vitro diagnostic',
      'implantable',
      'surgical instrument',
      'wearable sensor'
    ];

    // Build PatentsView query (GET encoded)
    const q = {
      _or: keywords.map(k => ({ _text_all: { patent_title: k } }))
    };
    const f = [
      'patent_number',
      'patent_title',
      'patent_date',
      'application_date',
      'assignee_organization',
      'inventor_first_name',
      'inventor_last_name',
      'cpc_group_id',
      'patent_abstract'
    ];
    const o = { per_page: limit, page: 1 };

    try {
      const base = 'https://search.patentsview.org/api/v1/patents/query';
      const url = `${base}?q=${encodeURIComponent(JSON.stringify(q))}&f=${encodeURIComponent(JSON.stringify(f))}&o=${encodeURIComponent(JSON.stringify(o))}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'application/json'
        },
        timeout: 20000
      });

      const patents: PatentRecord[] = [];
      const items = response.data?.patents || [];

      for (const item of items) {
        try {
          const inventors: string[] = [];
          if (item.inventors && Array.isArray(item.inventors)) {
            for (const inv of item.inventors) {
              const name = [inv.inventor_first_name, inv.inventor_last_name].filter(Boolean).join(' ');
              if (name) inventors.push(name);
            }
          }

            const cpcCodes: string[] = [];
            if (item.cpcs && Array.isArray(item.cpcs)) {
              for (const c of item.cpcs) {
                if (c.cpc_group_id) cpcCodes.push(c.cpc_group_id);
              }
            }

          const record: PatentRecord = {
            publicationNumber: item.patent_number,
            title: item.patent_title?.slice(0, 500) || 'Untitled Patent',
            abstract: item.patent_abstract || null,
            applicant: item.assignees?.[0]?.assignee_organization || null,
            inventors,
            publicationDate: item.patent_date || null,
            filingDate: item.application_date || null,
            status: 'granted',
            jurisdiction: 'US',
            cpcCodes,
            source: 'USPTO PatentsView',
            documentUrl: item.patent_number ? `https://patents.google.com/patent/US${item.patent_number}` : undefined
          };

          patents.push(record);
        } catch (parseError) {
          logger.error('Failed to parse patent item', { error: parseError });
        }
      }

      logger.info(`PatentsView: Collected ${patents.length} patents`);
      return patents;
    } catch (error) {
      logger.error('US patent collection failed', { error: axios.isAxiosError(error) ? error.message : error });
      return [];
    }
  }

  // EPO OPS Stub (requires client credentials -> access token step)
  async collectEpoPatents(limit: number = 15): Promise<PatentRecord[]> {
    const key = process.env.EPO_OPS_KEY;
    const secret = process.env.EPO_OPS_SECRET;
    if (!key || !secret) {
      logger.info('EPO OPS: Keine Credentials gesetzt (EPO_OPS_KEY / EPO_OPS_SECRET) -> übersprungen');
      return [];
    }
    // Token holen (Stub) – echte Implementierung benötigt POST auf auth endpoint
    logger.info('EPO OPS: Stub aktiv – echte API Integration folgt nach Token-Freigabe');
    return [];
  }

  // WIPO Patentscope Stub
  async collectWipoPatents(limit: number = 15): Promise<PatentRecord[]> {
    const token = process.env.WIPO_API_TOKEN;
    if (!token) {
      logger.info('WIPO: Kein Token (WIPO_API_TOKEN) -> übersprungen');
      return [];
    }
    logger.info('WIPO: Stub aktiv – Implementierung benötigt Query-Parameter & Auth');
    return [];
  }

  // Lens.org GraphQL minimal Implementation (falls Token vorhanden)
  async collectLensPatents(limit: number = 15): Promise<PatentRecord[]> {
    const token = process.env.LENS_API_TOKEN;
    if (!token) {
      logger.info('Lens.org: Kein Token (LENS_API_TOKEN) -> übersprungen');
      return [];
    }
    logger.info(`Lens.org: Sammle Patente (limit ${limit})...`);
    const query = {
      query: `query Search($query: String!, $limit: Int!) { searchPatents(query: $query, limit: $limit) { patents { publicationNumber title applicationDate publicationDate } } }`,
      variables: { query: 'medical device', limit }
    };
    try {
      const resp = await axios.post('https://api.lens.org/graphql', query, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': this.USER_AGENT },
        timeout: 25000
      });
      const items = resp.data?.data?.searchPatents?.patents || [];
      const patents: PatentRecord[] = [];
      for (const it of items) {
        if (!it.publicationNumber) continue;
        patents.push({
          publicationNumber: it.publicationNumber,
          title: it.title || 'Untitled',
          filingDate: it.applicationDate || undefined,
          publicationDate: it.publicationDate || undefined,
          status: 'unknown',
          jurisdiction: it.publicationNumber.startsWith('US') ? 'US' : undefined,
          inventors: [],
          source: 'Lens.org'
        });
      }
      logger.info(`Lens.org: Collected ${patents.length} patents`);
      return patents;
    } catch (err) {
      logger.error('Lens.org Anfrage fehlgeschlagen', { error: axios.isAxiosError(err) ? err.message : err });
      return [];
    }
  }

  // USPTO Bulk (stub – ohne Download, nur leer wegen keine Mock Daten erlaubt)
  async collectUsptoBulk(limit: number = 10): Promise<PatentRecord[]> {
    logger.info('USPTO Bulk: Stub aktiv – kein unmittelbarer Live-Endpunkt genutzt');
    return [];
  }

  async storePatents(patents: PatentRecord[]): Promise<number> {
    let stored = 0;
    for (const p of patents) {
      try {
        await storage.createPatent(p);
        stored++;
      } catch (err) {
        logger.error('Failed to store patent', { publicationNumber: p.publicationNumber, error: err });
      }
    }
    logger.info(`Stored ${stored}/${patents.length} patents in database`);
    return stored;
  }

  async collectAllPatents(): Promise<{ totalCollected: number; totalStored: number; errors: string[] }> {
    const errors: string[] = [];
    const start = Date.now();
    let all: PatentRecord[] = [];

    // Sequence of sources with delays to avoid bursts
    const sourceCalls: { name: string; fn: () => Promise<PatentRecord[]> }[] = [
      { name: 'USPTO Open Data', fn: () => this.collectUsptoOpenData(20) },
      { name: 'US PatentsView', fn: () => this.collectUSPatents(25) },
      { name: 'EPO OPS', fn: () => this.collectEpoPatents(15) },
      { name: 'WIPO Patentscope', fn: () => this.collectWipoPatents(15) },
      { name: 'Lens.org', fn: () => this.collectLensPatents(15) },
      { name: 'USPTO Bulk', fn: () => this.collectUsptoBulk(10) },
    ];

    for (const sc of sourceCalls) {
      try {
        await this.delay(this.REQUEST_DELAY);
        const items = await sc.fn();
        logger.info(`${sc.name}: ${items.length} erhalten`);
        all = all.concat(items);
      } catch (err) {
        errors.push(`${sc.name} Fehler`);
        logger.error(`${sc.name} Fehler`, { error: err });
      }
    }

    // Deduplikation nach publicationNumber
    const uniqueMap = new Map<string, PatentRecord>();
    for (const p of all) {
      if (!p.publicationNumber) continue;
      if (!uniqueMap.has(p.publicationNumber)) {
        uniqueMap.set(p.publicationNumber, p);
      }
    }
    const unique = Array.from(uniqueMap.values());

    const stored = await this.storePatents(unique);
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    logger.info(`Patent collection complete: ${unique.length} unique collected, ${stored} stored in ${duration}s`);

    return { totalCollected: unique.length, totalStored: stored, errors };
  }
}

export const patentCollector = new PatentCollector();
