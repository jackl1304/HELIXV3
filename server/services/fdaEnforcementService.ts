import { storage } from '../storage';

interface FDAEnforcement {
  recall_number?: string;
  status?: string;
  classification?: string;
  product_description?: string;
  reason_for_recall?: string;
  product_quantity?: string;
  recalling_firm?: string;
  city?: string;
  state?: string;
  country?: string;
  voluntary_mandated?: string;
  recall_initiation_date?: string;
  center_classification_date?: string;
  report_date?: string;
  distribution_pattern?: string;
  code_info?: string;
  event_id?: string;
  product_type?: string;
  openfda?: {
    device_name?: string;
    medical_specialty_description?: string;
    regulation_number?: string;
    device_class?: string;
  };
}

export class FDAEnforcementService {
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
      
      console.log(`🔄 [FDA Enforcement API] Requesting: ${urlWithKey.replace(this.apiKey, 'API_KEY_HIDDEN')} (attempt ${retryAttempt + 1})`);
      
      const response = await fetch(urlWithKey, {
        headers: {
          'User-Agent': 'Helix-Regulatory-Intelligence/2.0 (MedTech Compliance Platform)',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429 && retryAttempt < this.maxRetries) {
          console.log(`⏱️ [FDA Enforcement API] Rate limited, retrying after backoff...`);
          await this.exponentialBackoff(retryAttempt);
          return this.makeRequest(endpoint, retryAttempt + 1);
        }
        throw new Error(`FDA Enforcement API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      await this.delay(this.rateLimitDelay);
      
      console.log(`✅ [FDA Enforcement API] Request successful - received ${data.results?.length || 0} items`);
      return data;
    } catch (error) {
      if (retryAttempt < this.maxRetries) {
        console.log(`🔄 [FDA Enforcement API] Retrying request (attempt ${retryAttempt + 2})...`);
        await this.exponentialBackoff(retryAttempt);
        return this.makeRequest(endpoint, retryAttempt + 1);
      }
      
      console.error(`❌ [FDA Enforcement API] Request failed after ${retryAttempt + 1} attempts:`, error);
      throw error;
    }
  }

  async collectEnforcementActions(limit: number = 50): Promise<FDAEnforcement[]> {
    try {
      console.log(`[FDA Enforcement API] Collecting enforcement actions (limit: ${limit})`);
      
      const endpoint = `${this.baseUrl}/device/enforcement.json?limit=${limit}&sort=report_date:desc`;
      const data = await this.makeRequest(endpoint);
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid FDA Enforcement response format');
      }
      
      console.log(`[FDA Enforcement API] Found ${data.results.length} enforcement actions`);
      
      for (const enforcement of data.results as FDAEnforcement[]) {
        await this.processEnforcement(enforcement);
      }
      
      console.log(`[FDA Enforcement API] Enforcement collection completed`);
      return data.results as FDAEnforcement[];
    } catch (error) {
      console.error('[FDA Enforcement API] Error collecting enforcement actions:', error);
      throw error;
    }
  }

  private async processEnforcement(enforcement: FDAEnforcement): Promise<void> {
    try {
      const deviceName = enforcement.product_description || 
                        enforcement.openfda?.device_name || 
                        'Medical Device';
      const recallNumber = enforcement.recall_number || enforcement.event_id || 'Unknown';
      
      const regulatoryUpdate = {
        title: `FDA Enforcement: ${deviceName.substring(0, 100)} (${recallNumber})`,
        description: this.formatEnforcementContent(enforcement),
        sourceId: 'fda_enforcement',
        sourceUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=${enforcement.event_id}`,
        region: 'US',
        updateType: 'recall' as const,
        priority: this.determinePriority(enforcement),
        deviceClasses: enforcement.openfda?.device_class ? [enforcement.openfda.device_class] : [],
        categories: await this.categorizeEnforcement(enforcement),
        rawData: enforcement,
        publishedAt: this.parseDate(enforcement.report_date) || new Date(),
      };
      
      await storage.createRegulatoryUpdate(regulatoryUpdate);
      console.log(`[FDA Enforcement API] Successfully created regulatory update: ${regulatoryUpdate.title}`);
    } catch (error) {
      console.error('[FDA Enforcement API] Error processing enforcement action:', error);
    }
  }

  private formatEnforcementContent(enforcement: FDAEnforcement): string {
    const parts = [
      `Recall Number: ${enforcement.recall_number || 'N/A'}`,
      `Status: ${enforcement.status || 'N/A'}`,
      `Classification: ${enforcement.classification || 'N/A'}`,
      `Product: ${enforcement.product_description || 'N/A'}`,
      `Recalling Firm: ${enforcement.recalling_firm || 'N/A'}`,
      `Location: ${enforcement.city || 'N/A'}, ${enforcement.state || 'N/A'}, ${enforcement.country || 'N/A'}`,
      `Type: ${enforcement.voluntary_mandated || 'N/A'}`,
      `Recall Initiation Date: ${enforcement.recall_initiation_date || 'N/A'}`,
      `Report Date: ${enforcement.report_date || 'N/A'}`
    ];

    if (enforcement.reason_for_recall) {
      parts.push(`\nReason for Recall:\n${enforcement.reason_for_recall}`);
    }

    if (enforcement.distribution_pattern) {
      parts.push(`\nDistribution Pattern:\n${enforcement.distribution_pattern}`);
    }

    if (enforcement.product_quantity) {
      parts.push(`\nProduct Quantity: ${enforcement.product_quantity}`);
    }

    if (enforcement.code_info) {
      parts.push(`\nCode Info: ${enforcement.code_info}`);
    }

    return parts.join('\n');
  }

  private parseDate(dateString: string | undefined): Date | null {
    if (!dateString) return null;
    
    try {
      // FDA uses YYYYMMDD format
      if (dateString.length === 8) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      return null;
    } catch {
      return null;
    }
  }

  private determinePriority(enforcement: FDAEnforcement): 'critical' | 'high' | 'medium' | 'low' {
    const classification = enforcement.classification?.toLowerCase() || '';
    
    // Class I recalls are critical (most serious)
    if (classification.includes('class i')) {
      return 'critical';
    }
    
    // Class II recalls are high priority
    if (classification.includes('class ii')) {
      return 'high';
    }
    
    // Class III recalls are medium priority
    if (classification.includes('class iii')) {
      return 'medium';
    }
    
    // Ongoing recalls are higher priority
    if (enforcement.status?.toLowerCase() === 'ongoing') {
      return 'high';
    }
    
    return 'medium';
  }

  private async categorizeEnforcement(enforcement: FDAEnforcement): Promise<string[]> {
    const categories: string[] = ['FDA Enforcement', 'Device Recall', 'Safety Alert', 'US Regulatory'];
    
    if (enforcement.classification) {
      categories.push(enforcement.classification);
    }
    
    if (enforcement.voluntary_mandated?.includes('Voluntary')) {
      categories.push('Voluntary Recall');
    } else if (enforcement.voluntary_mandated?.includes('Mandated')) {
      categories.push('Mandatory Recall');
    }
    
    if (enforcement.status) {
      categories.push(enforcement.status);
    }
    
    if (enforcement.openfda?.medical_specialty_description) {
      categories.push(enforcement.openfda.medical_specialty_description);
    }
    
    return categories;
  }
}

export const fdaEnforcementService = new FDAEnforcementService();
