import { storage } from '../storage';

interface EMAMedicine {
  name_of_medicine?: string;
  active_substance?: string;
  therapeutic_area_mesh?: string;
  marketing_authorisation_developer_applicant_holder?: string;
  medicine_status?: string;
  international_non_proprietary_name_common_name?: string;
  category?: string;
  species_veterinary?: string;
  first_published_date?: string;
  last_updated_date?: string;
  medicine_url?: string;
  ema_product_number?: string;
  opinion_status?: string;
  pharmacotherapeutic_group_human?: string;
  orphan_medicine?: string;
  advanced_therapy?: string;
}

export class EMAEparService {
  private baseUrl = 'https://www.ema.europa.eu';
  private rateLimitDelay = 1000;
  private maxRetries = 3;
  private retryDelay = 2000;

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async exponentialBackoff(attempt: number): Promise<void> {
    const delay = this.retryDelay * Math.pow(2, attempt);
    await this.delay(delay);
  }

  private async makeRequest(url: string, retryAttempt: number = 0): Promise<any> {
    try {
      console.log(`🔄 [EMA API] Requesting: ${url} (attempt ${retryAttempt + 1})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Helix-Regulatory-Intelligence/2.0 (MedTech Compliance Platform)',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429 && retryAttempt < this.maxRetries) {
          console.log(`⏱️ [EMA API] Rate limited, retrying after backoff...`);
          await this.exponentialBackoff(retryAttempt);
          return this.makeRequest(url, retryAttempt + 1);
        }
        throw new Error(`EMA API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      await this.delay(this.rateLimitDelay);
      
      console.log(`✅ [EMA API] Request successful - received ${Array.isArray(data) ? data.length : 'object'} items`);
      return data;
    } catch (error) {
      if (retryAttempt < this.maxRetries) {
        console.log(`🔄 [EMA API] Retrying request (attempt ${retryAttempt + 2})...`);
        await this.exponentialBackoff(retryAttempt);
        return this.makeRequest(url, retryAttempt + 1);
      }
      
      console.error(`❌ [EMA API] Request failed after ${retryAttempt + 1} attempts:`, error);
      throw error;
    }
  }

  async collectMedicines(limit: number = 100): Promise<EMAMedicine[]> {
    try {
      console.log(`[EMA API] Collecting medicines (limit: ${limit})`);
      
      const endpoint = `${this.baseUrl}/en/documents/report/medicines-output-medicines_json-report_en.json`;
      const data = await this.makeRequest(endpoint);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid EMA response format - expected array');
      }
      
      const recentMedicines = data
        .filter((m: any) => m.category && m.category.toLowerCase() === 'human')
        .sort((a: any, b: any) => {
          const dateA = new Date(a.last_updated_date || a.first_published_date || 0);
          const dateB = new Date(b.last_updated_date || b.first_published_date || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);
      
      console.log(`[EMA API] Found ${recentMedicines.length} recent medicines with EPAR`);
      
      for (const medicine of recentMedicines as EMAMedicine[]) {
        await this.processMedicine(medicine);
      }
      
      console.log(`[EMA API] Medicine collection completed`);
      return recentMedicines as EMAMedicine[];
    } catch (error) {
      console.error('[EMA API] Error collecting medicines:', error);
      throw error;
    }
  }

  private async processMedicine(medicine: EMAMedicine): Promise<void> {
    try {
      const regulatoryUpdate = {
        title: `EMA EPAR: ${medicine.name_of_medicine || 'Unknown Medicine'}`,
        description: this.formatMedicineContent(medicine),
        sourceId: 'ema_epar',
        sourceUrl: medicine.medicine_url || `https://www.ema.europa.eu/en/medicines`,
        region: 'EU',
        updateType: 'approval' as const,
        priority: this.determinePriority(medicine),
        deviceClasses: [],
        categories: await this.categorizeMedicine(medicine),
        rawData: medicine,
        publishedAt: this.parseDate(medicine.last_updated_date || medicine.first_published_date) || new Date(),
      };
      
      await storage.createRegulatoryUpdate(regulatoryUpdate);
      console.log(`[EMA API] Successfully created regulatory update: ${regulatoryUpdate.title}`);
    } catch (error) {
      console.error('[EMA API] Error processing medicine:', error);
    }
  }

  private formatMedicineContent(medicine: EMAMedicine): string {
    const parts = [
      `Product Number: ${medicine.ema_product_number || 'N/A'}`,
      `Active Substance: ${medicine.active_substance || 'N/A'}`,
      `Marketing Authorisation Holder: ${medicine.marketing_authorisation_developer_applicant_holder || 'N/A'}`,
      `Medicine Status: ${medicine.medicine_status || 'N/A'}`,
      `Therapeutic Area: ${medicine.therapeutic_area_mesh || 'N/A'}`,
      `INN: ${medicine.international_non_proprietary_name_common_name || 'N/A'}`,
      `First Published: ${medicine.first_published_date || 'N/A'}`,
      `Last Updated: ${medicine.last_updated_date || 'N/A'}`
    ];

    if (medicine.opinion_status) {
      parts.push(`Opinion Status: ${medicine.opinion_status}`);
    }

    if (medicine.orphan_medicine === 'Yes') {
      parts.push(`Orphan Medicine: Yes`);
    }

    if (medicine.advanced_therapy === 'Yes') {
      parts.push(`Advanced Therapy: Yes`);
    }

    return parts.join('\n');
  }

  private parseDate(dateString: string | undefined): Date | null {
    if (!dateString) return null;
    
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
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

  private determinePriority(medicine: EMAMedicine): 'critical' | 'high' | 'medium' | 'low' {
    const therapeuticArea = medicine.therapeutic_area_mesh?.toLowerCase() || '';
    const status = medicine.medicine_status?.toLowerCase() || '';
    
    if (medicine.orphan_medicine === 'Yes' || medicine.advanced_therapy === 'Yes') {
      return 'high';
    }
    
    if (status.includes('authorised') && 
        (therapeuticArea.includes('oncology') || 
         therapeuticArea.includes('cardiovascular') ||
         therapeuticArea.includes('rare disease'))) {
      return 'high';
    }
    
    if (status.includes('suspended') || status.includes('withdrawn')) {
      return 'critical';
    }
    
    if (status.includes('authorised')) {
      return 'medium';
    }
    
    return 'low';
  }

  private async categorizeMedicine(medicine: EMAMedicine): Promise<string[]> {
    const categories: string[] = ['EMA EPAR', 'EU Regulatory'];
    const therapeuticArea = medicine.therapeutic_area_mesh?.toLowerCase() || '';
    
    if (therapeuticArea.includes('cardio')) categories.push('Cardiovascular');
    if (therapeuticArea.includes('onco') || therapeuticArea.includes('cancer')) categories.push('Oncology');
    if (therapeuticArea.includes('neuro')) categories.push('Neurology');
    if (therapeuticArea.includes('rare')) categories.push('Rare Disease');
    if (therapeuticArea.includes('diabetes')) categories.push('Diabetes');
    
    if (medicine.orphan_medicine === 'Yes') {
      categories.push('Orphan Medicine');
    }
    
    if (medicine.advanced_therapy === 'Yes') {
      categories.push('Advanced Therapy');
    }
    
    if (medicine.medicine_status?.toLowerCase().includes('authorised')) {
      categories.push('Marketing Authorisation');
    }
    
    return categories;
  }
}

export const emaEparService = new EMAEparService();
