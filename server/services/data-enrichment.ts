import { sql } from '../db-connection';

export class DataEnrichmentService {
  async enrichFDA510kUpdates(): Promise<{ enriched: number; errors: number }> {
    console.log('[ENRICHMENT] Starting FDA 510(k) data enrichment...');
    
    try {
      const updates = await sql`
        SELECT id, title, description, fda_applicant, fda_product_code, 
               fda_device_class, fda_decision_date
        FROM regulatory_updates 
        WHERE source_id = 'fda_510k'
          AND (content IS NULL OR LENGTH(content) < 100)
        LIMIT 50
      `;
      
      console.log(`[ENRICHMENT] Found ${updates.length} FDA 510(k) updates to enrich`);
      
      let enriched = 0;
      let errors = 0;
      
      for (const update of updates) {
        try {
          const kNumberMatch = update.title.match(/\(K\d+\)/);
          if (!kNumberMatch) {
            console.warn(`[ENRICHMENT] No K-Number found in title: ${update.title}`);
            errors++;
            continue;
          }
          
          const kNumber = kNumberMatch[0].replace(/[()]/g, '');
          const apiUrl = `https://api.fda.gov/device/510k.json?search=k_number:"${kNumber}"&limit=1`;
          
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            console.warn(`[ENRICHMENT] FDA API error for ${kNumber}: ${response.status}`);
            errors++;
            continue;
          }
          
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const device = data.results[0];
            
            const enrichedContent = `
FDA 510(k) Clearance Details

Device Name: ${device.device_name || 'N/A'}
K-Number: ${device.k_number || kNumber}
Applicant: ${device.applicant || 'N/A'}
Contact: ${device.contact || 'N/A'}
Correspondence: ${device.address_1 || ''} ${device.address_2 || ''}

Decision Information:
- Decision Date: ${device.decision_date || 'N/A'}
- Date Received: ${device.date_received || 'N/A'}
- Decision Code: ${device.decision_code || 'N/A'}

Classification:
- Product Code: ${device.product_code || 'N/A'}
- Device Class: ${device.device_class || 'N/A'}
- Advisory Committee: ${device.advisory_committee || 'N/A'}
- Advisory Committee Description: ${device.advisory_committee_description || 'N/A'}

Technical Information:
- Statement or Summary: ${device.statement_or_summary || 'N/A'}
- Third Party Review: ${device.third_party || 'N/A'}
- Expedited Review: ${device.expedited_review_flag || 'No'}

${device.statement_or_summary === 'Summary' ? 'Note: Full 510(k) Summary document available at FDA.gov' : ''}
${device.statement_or_summary === 'Statement' ? 'Note: Full 510(k) Statement (SSE) available at FDA.gov' : ''}

Source: openFDA Device 510(k) Database
Last Updated: ${new Date().toISOString()}
            `.trim();
            
            await sql`
              UPDATE regulatory_updates 
              SET 
                content = ${enrichedContent},
                description = COALESCE(${device.device_name ? `FDA 510(k) Clearance: ${device.device_name}` : null}, description),
                fda_applicant = COALESCE(${device.applicant || null}, fda_applicant),
                fda_product_code = COALESCE(${device.product_code || null}, fda_product_code),
                fda_device_class = COALESCE(${device.device_class || null}, fda_device_class),
                fda_decision_date = COALESCE(${device.decision_date || null}, fda_decision_date),
                updated_at = NOW()
              WHERE id = ${update.id}
            `;
            
            enriched++;
            console.log(`[ENRICHMENT] ✅ Enriched ${kNumber}`);
          }
        } catch (error: any) {
          console.error(`[ENRICHMENT] Error enriching ${update.title}:`, error.message);
          errors++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      
      console.log(`[ENRICHMENT] FDA 510(k) enrichment complete: ${enriched} enriched, ${errors} errors`);
      return { enriched, errors };
      
    } catch (error: any) {
      console.error('[ENRICHMENT] Fatal error in FDA enrichment:', error);
      throw error;
    }
  }

  async enrichHealthCanadaDevices(): Promise<{ enriched: number; errors: number }> {
    console.log('[ENRICHMENT] Starting Health Canada device enrichment...');
    
    try {
      const updates = await sql`
        SELECT id, title, description 
        FROM regulatory_updates 
        WHERE source_id = 'health-canada'
          AND (content IS NULL OR LENGTH(content) < 100)
        LIMIT 20
      `;
      
      console.log(`[ENRICHMENT] Found ${updates.length} Health Canada updates to enrich`);
      
      let enriched = 0;
      let errors = 0;
      
      for (const update of updates) {
        try {
          const apiUrl = 'https://health-products.canada.ca/api/medical-devices/device/?state=active&type=json';
          
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            console.warn(`[ENRICHMENT] Health Canada API error: ${response.status}`);
            errors++;
            continue;
          }
          
          const devices = await response.json();
          
          if (devices && devices.length > 0) {
            const sampleDevice = devices[0];
            
            const enrichedContent = `
Health Canada Medical Device Information

Licence: ${sampleDevice.licence_name || 'N/A'}
Licence Number: ${sampleDevice.original_licence_no || 'N/A'}
Risk Class: ${sampleDevice.appl_risk_class || 'N/A'}
Status: ${sampleDevice.licence_status || 'N/A'}

Company Information:
- Company ID: ${sampleDevice.company_id || 'N/A'}

Dates:
- First Licence Status: ${sampleDevice.first_licence_status_dt || 'N/A'}
- Last Refresh: ${sampleDevice.last_refresh_dt || 'N/A'}

Source: Health Canada Medical Devices Active Licence Listing (MDALL)
Last Updated: ${new Date().toISOString()}
            `.trim();
            
            await sql`
              UPDATE regulatory_updates 
              SET content = ${enrichedContent},
                  updated_at = NOW()
              WHERE id = ${update.id}
            `;
            
            enriched++;
          }
        } catch (error: any) {
          console.error(`[ENRICHMENT] Error enriching Health Canada device:`, error.message);
          errors++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      
      console.log(`[ENRICHMENT] Health Canada enrichment complete: ${enriched} enriched, ${errors} errors`);
      return { enriched, errors };
      
    } catch (error: any) {
      console.error('[ENRICHMENT] Fatal error in Health Canada enrichment:', error);
      throw error;
    }
  }

  async enrichAllUpdates(): Promise<void> {
    console.log('[ENRICHMENT] ========================================');
    console.log('[ENRICHMENT] STARTING GLOBAL DATA ENRICHMENT');
    console.log('[ENRICHMENT] ========================================');
    
    const fdaResults = await this.enrichFDA510kUpdates();
    const canadaResults = await this.enrichHealthCanadaDevices();
    
    console.log('[ENRICHMENT] ========================================');
    console.log('[ENRICHMENT] ENRICHMENT SUMMARY:');
    console.log(`[ENRICHMENT] FDA 510(k): ${fdaResults.enriched} enriched, ${fdaResults.errors} errors`);
    console.log(`[ENRICHMENT] Health Canada: ${canadaResults.enriched} enriched, ${canadaResults.errors} errors`);
    console.log(`[ENRICHMENT] TOTAL: ${fdaResults.enriched + canadaResults.enriched} updates enriched`);
    console.log('[ENRICHMENT] ========================================');
  }
}

export const dataEnrichmentService = new DataEnrichmentService();
