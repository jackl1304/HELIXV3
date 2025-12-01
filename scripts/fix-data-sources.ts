import 'dotenv/config';
import { getScriptDb } from './script-db.js';
import { dataSources } from '../shared/schema.js';

const requiredSources = [
  {
    id: 'fda_pma',
    name: 'FDA PMA Database',
    url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm',
    type: 'regulatory',
    status: 'active',
  },
  {
    id: 'fda_510k',
    name: 'FDA 510(k) Database',
    url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm',
    type: 'regulatory',
    status: 'active',
  },
  {
    id: 'ema_epar',
    name: 'EMA EPAR Database',
    url: 'https://www.ema.europa.eu/en/medicines/human/EPAR',
    type: 'regulatory',
    status: 'active',
  },
  {
    id: 'health_canada',
    name: 'Health Canada Medical Devices',
    url: 'https://health-products.canada.ca/api/medical-devices/',
    type: 'regulatory',
    status: 'active',
  },
  {
    id: 'fda_maude',
    name: 'FDA MAUDE Database',
    url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfmaude/search.cfm',
    type: 'regulatory',
    status: 'active',
  },
];

async function fixDataSources() {
  const { sql, db } = getScriptDb();
  console.log('🔧 Fixing missing data sources...');

  for (const source of requiredSources) {
    try {
      await sql`
        INSERT INTO data_sources (id, name, url, type, is_active, created_at, updated_at)
        VALUES (
          ${source.id},
          ${source.name},
          ${source.url},
          ${source.type},
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      console.log(`✅ Added/verified: ${source.id}`);
    } catch (error) {
      console.error(`❌ Error with ${source.id}:`, error);
    }
  }

  console.log('✅ All data sources fixed!');
  process.exit(0);
}

fixDataSources();
