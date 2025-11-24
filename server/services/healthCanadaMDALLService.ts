import { storage } from '../storage';

interface HealthCanadaDevice {
  device_id?: number;
  trade_name?: string;
  original_licence_no?: number;
  first_licence_dt?: string;
  end_date?: string | null;
}

export class HealthCanadaMDALLService {
  private baseUrl = 'https://health-products.canada.ca';
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
      console.log(`🔄 [Health Canada API] Requesting: ${url} (attempt ${retryAttempt + 1})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Helix-Regulatory-Intelligence/2.0 (MedTech Compliance Platform)',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429 && retryAttempt < this.maxRetries) {
          console.log(`⏱️ [Health Canada API] Rate limited, retrying after backoff...`);
          await this.exponentialBackoff(retryAttempt);
          return this.makeRequest(url, retryAttempt + 1);
        }
        throw new Error(`Health Canada API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      await this.delay(this.rateLimitDelay);
      
      console.log(`✅ [Health Canada API] Request successful - received ${Array.isArray(data) ? data.length : 'object'} items`);
      return data;
    } catch (error) {
      if (retryAttempt < this.maxRetries) {
        console.log(`🔄 [Health Canada API] Retrying request (attempt ${retryAttempt + 2})...`);
        await this.exponentialBackoff(retryAttempt);
        return this.makeRequest(url, retryAttempt + 1);
      }
      
      console.error(`❌ [Health Canada API] Request failed after ${retryAttempt + 1} attempts:`, error);
      throw error;
    }
  }

  async collectActiveDevices(limit: number = 100): Promise<HealthCanadaDevice[]> {
    try {
      console.log(`[Health Canada API] Collecting active devices (limit: ${limit})`);
      
      const endpoint = `${this.baseUrl}/api/medical-devices/device/?type=json&state=active`;
      const data = await this.makeRequest(endpoint);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid Health Canada response format - expected array');
      }
      
      const recentDevices = data
        .filter((d: any) => d.trade_name && d.first_licence_dt)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.first_licence_dt || 0);
          const dateB = new Date(b.first_licence_dt || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);
      
      console.log(`[Health Canada API] Found ${recentDevices.length} recent active devices`);
      
      for (const device of recentDevices as HealthCanadaDevice[]) {
        await this.processDevice(device);
      }
      
      console.log(`[Health Canada API] Device collection completed`);
      return recentDevices as HealthCanadaDevice[];
    } catch (error) {
      console.error('[Health Canada API] Error collecting devices:', error);
      throw error;
    }
  }

  private async processDevice(device: HealthCanadaDevice): Promise<void> {
    try {
      const regulatoryUpdate = {
        title: `Health Canada: ${device.trade_name || 'Medical Device'}${device.original_licence_no ? ` (Licence ${device.original_licence_no})` : ''}`,
        description: this.formatDeviceContent(device),
        sourceId: 'health_canada',
        sourceUrl: device.original_licence_no 
          ? `https://health-products.canada.ca/api/medical-devices/licence/?id=${device.original_licence_no}&type=json`
          : `https://health-products.canada.ca/mdall-limh/`,
        region: 'CA',
        updateType: 'approval' as const,
        priority: 'medium' as const,
        deviceClasses: [],
        categories: await this.categorizeDevice(device),
        rawData: device,
        publishedAt: this.parseDate(device.first_licence_dt) || new Date(),
      };
      
      await storage.createRegulatoryUpdate(regulatoryUpdate);
      console.log(`[Health Canada API] Successfully created regulatory update: ${regulatoryUpdate.title}`);
    } catch (error) {
      console.error('[Health Canada API] Error processing device:', error);
    }
  }

  private formatDeviceContent(device: HealthCanadaDevice): string {
    const parts = [
      `Licence Number: ${device.original_licence_no || 'N/A'}`,
      `Device ID: ${device.device_id || 'N/A'}`,
      `Trade Name: ${device.trade_name || 'N/A'}`,
      `First Licence Date: ${device.first_licence_dt || 'N/A'}`,
      `Status: ${device.end_date ? `Expired (${device.end_date})` : 'Active'}`
    ];

    return parts.join('\n');
  }

  private parseDate(dateString: string | undefined): Date | null {
    if (!dateString) return null;
    
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  }

  private async categorizeDevice(device: HealthCanadaDevice): Promise<string[]> {
    const categories: string[] = ['Health Canada MDALL', 'Canadian Regulatory'];
    const deviceName = device.trade_name?.toLowerCase() || '';
    
    if (deviceName.includes('cardio') || deviceName.includes('heart')) categories.push('Cardiovascular');
    if (deviceName.includes('neuro') || deviceName.includes('brain')) categories.push('Neurology');
    if (deviceName.includes('ortho') || deviceName.includes('joint')) categories.push('Orthopedics');
    if (deviceName.includes('diagnostic') || deviceName.includes('imaging')) categories.push('Diagnostics');
    if (deviceName.includes('software') || deviceName.includes('ai')) categories.push('Software Medical Device');
    if (deviceName.includes('implant')) categories.push('Implantable Device');
    if (deviceName.includes('glove')) categories.push('Protective Equipment');
    if (deviceName.includes('surgical') || deviceName.includes('instrument')) categories.push('Surgical Instruments');
    
    return categories;
  }
}

export const healthCanadaMDALLService = new HealthCanadaMDALLService();
