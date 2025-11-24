import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function initializeDataSources() {
  console.log('🔧 Initializing data sources...');

  const dataSources = [
    {
      id: 'fda_pma',
      name: 'FDA PMA Database',
      url: 'https://api.fda.gov/device/pma.json',
      description: 'FDA Premarket Approval (PMA) Database - Class III medical devices',
      country: 'US',
      type: 'api',
      isActive: true
    },
    {
      id: 'fda_510k',
      name: 'FDA 510(k) Database',
      url: 'https://api.fda.gov/device/510k.json',
      description: 'FDA 510(k) Premarket Notification Database',
      country: 'US',
      type: 'api',
      isActive: true
    },
    {
      id: 'fda_recall',
      name: 'FDA Device Recalls',
      url: 'https://api.fda.gov/device/recall.json',
      description: 'FDA Medical Device Recalls Database',
      country: 'US',
      type: 'api',
      isActive: true
    },
    {
      id: 'ema_epar',
      name: 'EMA EPAR Database',
      url: 'https://www.ema.europa.eu/en/medicines/field_ema_web_categories%253Aname_field/Human/ema_group_types/ema_medicine',
      description: 'European Medicines Agency - European Public Assessment Reports',
      country: 'EU',
      type: 'scraper',
      isActive: true
    },
    {
      id: 'health_canada',
      name: 'Health Canada MDALL',
      url: 'https://health-products.canada.ca/mdall-limh/index-eng.jsp',
      description: 'Health Canada Medical Devices Active License Listing',
      country: 'CA',
      type: 'api',
      isActive: true
    },
    {
      id: 'mhra_uk',
      name: 'MHRA UK',
      url: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency',
      description: 'UK Medicines and Healthcare products Regulatory Agency',
      country: 'GB',
      type: 'scraper',
      isActive: true
    },
    {
      id: 'swissmedic',
      name: 'Swissmedic',
      url: 'https://www.swissmedic.ch',
      description: 'Swiss Agency for Therapeutic Products',
      country: 'CH',
      type: 'scraper',
      isActive: true
    },
    {
      id: 'bfarm',
      name: 'BfArM Germany',
      url: 'https://www.bfarm.de',
      description: 'German Federal Institute for Drugs and Medical Devices',
      country: 'DE',
      type: 'scraper',
      isActive: true
    }
  ];

  try {
    for (const source of dataSources) {
      await sql`
        INSERT INTO data_sources (id, name, url, description, country, type, is_active, created_at, updated_at)
        VALUES (
          ${source.id},
          ${source.name},
          ${source.url},
          ${source.description},
          ${source.country},
          ${source.type},
          ${source.isActive},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          url = EXCLUDED.url,
          description = EXCLUDED.description,
          country = EXCLUDED.country,
          type = EXCLUDED.type,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
      `;
      console.log(`✅ Initialized data source: ${source.name}`);
    }

    console.log('\n✅ All data sources initialized successfully!');

  } catch (error) {
    console.error('❌ Error initializing data sources:', error);
    process.exit(1);
  }
}

initializeDataSources();
