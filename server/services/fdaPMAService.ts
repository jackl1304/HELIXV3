import { storage } from '../storage';

interface FDAPMA {
  pma_number?: string;
  supplement_number?: string;
  applicant?: string;
  trade_name?: string;
  generic_name?: string;
  product_code?: string;
  advisory_committee?: string;
  advisory_committee_description?: string;
  date_received?: string;
  decision_date?: string;
  decision_code?: string;
  ao_statement?: string;
  supplement_type?: string;
  supplement_reason?: string;
  expedited_review_flag?: string;
  openfda?: {
    device_name?: string;
    medical_specialty_description?: string;
    regulation_number?: string;
    device_class?: string;
    fei_number?: string[];
    registration_number?: string[];
  };
}

export class FDAPMAService {
  private baseUrl = 'https://api.fda.gov';
  private apiKey = process.env.FDA_API_KEY || '';
  private rateLimitDelay = 250;
  private maxRetries = 3;
  private retryDelay = 2000;

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async exponentialBackoff(attempt: number): Promise<void> {
    const delay = this.retryDelay * Math.pow(2, attempt);
    await this.delay(delay);
  }

  private async makeRequest(endpoint: string, retryAttempt: number = 0): Promise<any> {
    try {
      const urlWithKey = this.apiKey ? 
        `${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${this.apiKey}` : 
        endpoint;
      
      console.log(`🔄 [FDA PMA API] Requesting: ${urlWithKey.replace(this.apiKey, 'API_KEY_HIDDEN')} (attempt ${retryAttempt + 1})`);
      
      const response = await fetch(urlWithKey, {
        headers: {
          'User-Agent': 'Helix-Regulatory-Intelligence/2.0 (MedTech Compliance Platform)',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429 && retryAttempt < this.maxRetries) {
          console.log(`⏱️ [FDA PMA API] Rate limited, retrying after backoff...`);
          await this.exponentialBackoff(retryAttempt);
          return this.makeRequest(endpoint, retryAttempt + 1);
        }
        throw new Error(`FDA PMA API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      await this.delay(this.rateLimitDelay);
      
      console.log(`✅ [FDA PMA API] Request successful - received ${data.results?.length || 0} items`);
      return data;
    } catch (error) {
      if (retryAttempt < this.maxRetries) {
        console.log(`🔄 [FDA PMA API] Retrying request (attempt ${retryAttempt + 2})...`);
        await this.exponentialBackoff(retryAttempt);
        return this.makeRequest(endpoint, retryAttempt + 1);
      }
      
      console.error(`❌ [FDA PMA API] Request failed after ${retryAttempt + 1} attempts:`, error);
      throw error;
    }
  }

  async collectPMAApprovals(limit: number = 100): Promise<FDAPMA[]> {
    try {
      console.log(`[FDA PMA API] Collecting PMA approvals (limit: ${limit})`);
      
      const endpoint = `${this.baseUrl}/device/pma.json?limit=${limit}&sort=decision_date:desc`;
      const data = await this.makeRequest(endpoint);
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid FDA PMA response format');
      }
      
      console.log(`[FDA PMA API] Found ${data.results.length} PMA approvals`);
      
      for (const pma of data.results as FDAPMA[]) {
        await this.processPMA(pma);
      }
      
      console.log(`[FDA PMA API] PMA collection completed`);
      return data.results as FDAPMA[];
    } catch (error) {
      console.error('[FDA PMA API] Error collecting PMA approvals:', error);
      throw error;
    }
  }

  private async processPMA(pma: FDAPMA): Promise<void> {
    try {
      const deviceName = pma.trade_name || pma.generic_name || pma.openfda?.device_name || 'Unknown Device';
      const pmaNumber = pma.pma_number || 'Unknown';
      const supplementNumber = pma.supplement_number ? `S${pma.supplement_number}` : '';
      
      const regulatoryUpdate = {
        title: `FDA PMA: ${deviceName} (${pmaNumber}${supplementNumber})`,
        description: this.formatPMAContent(pma),
        sourceId: 'fda_pma',
        sourceUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=${pmaNumber}`,
        region: 'US',
        updateType: 'approval' as const,
        priority: this.determinePriority(pma),
        deviceClasses: pma.openfda?.device_class ? [pma.openfda.device_class] : ['3'],
        categories: await this.categorizePMA(pma),
        rawData: pma,
        publishedAt: this.parseDate(pma.decision_date) || new Date(),
      };
      
      await storage.createRegulatoryUpdate(regulatoryUpdate);
      console.log(`[FDA PMA API] Successfully created regulatory update: ${regulatoryUpdate.title}`);
    } catch (error) {
      console.error('[FDA PMA API] Error processing PMA:', error);
    }
  }

  private formatPMAContent(pma: FDAPMA): string {
    const parts = [
      `PMA Number: ${pma.pma_number || 'N/A'}`,
      `Trade Name: ${pma.trade_name || 'N/A'}`,
      `Generic Name: ${pma.generic_name || 'N/A'}`,
      `Applicant: ${pma.applicant || 'N/A'}`,
      `Decision Date: ${pma.decision_date || 'N/A'}`,
      `Decision Code: ${pma.decision_code || 'N/A'}`,
      `Advisory Committee: ${pma.advisory_committee_description || pma.advisory_committee || 'N/A'}`,
      `Product Code: ${pma.product_code || 'N/A'}`,
      `Device Class: ${pma.openfda?.device_class || 'N/A'}`
    ];

    if (pma.supplement_number) {
      parts.push(`Supplement Number: ${pma.supplement_number}`);
      parts.push(`Supplement Type: ${pma.supplement_type || 'N/A'}`);
      parts.push(`Supplement Reason: ${pma.supplement_reason || 'N/A'}`);
    }

    if (pma.ao_statement) {
      parts.push(`Statement: ${pma.ao_statement}`);
    }

    if (pma.expedited_review_flag === 'Y') {
      parts.push(`Expedited Review: Yes`);
    }

    return parts.join('\n');
  }

  private parseDate(dateString: string | undefined): Date | null {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      return null;
    } catch {
      return null;
    }
  }

  private determinePriority(pma: FDAPMA): 'critical' | 'high' | 'medium' | 'low' {
    // PMA devices are Class III (highest risk)
    if (pma.expedited_review_flag === 'Y') {
      return 'critical';
    }
    
    // Class III devices are always high priority
    if (pma.openfda?.device_class === '3') {
      return 'high';
    }
    
    // Cardiovascular, Neurology are critical
    const specialty = pma.advisory_committee_description?.toLowerCase() || '';
    if (specialty.includes('cardiovascular') || specialty.includes('neurology')) {
      return 'critical';
    }
    
    return 'high';
  }

  private async categorizePMA(pma: FDAPMA): Promise<string[]> {
    const categories: string[] = ['FDA PMA', 'Premarket Approval', 'Class III Device', 'US Regulatory'];
    
    if (pma.advisory_committee_description) {
      categories.push(pma.advisory_committee_description);
    }
    
    if (pma.openfda?.medical_specialty_description) {
      categories.push(pma.openfda.medical_specialty_description);
    }
    
    if (pma.expedited_review_flag === 'Y') {
      categories.push('Expedited Review');
    }
    
    if (pma.supplement_number) {
      categories.push('PMA Supplement');
    }
    
    return categories;
  }
}

export const fdaPMAService = new FDAPMAService();
