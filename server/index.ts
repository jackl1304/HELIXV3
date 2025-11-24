
// Load environment variables first
import { config } from "dotenv";
config();

import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { db, dbDriver } from './db';
import { setupVite, serveStatic } from "./vite";
import { dailySyncScheduler } from './services/dailySyncScheduler';
import { startSourceImportScheduler, getSchedulerStatus, runImmediateImportCycle } from './services/sourceImportScheduler';
import { sanitizeObjectDeep } from '../client/src/lib/neutralTerms';

// Windows-kompatible __dirname für ES-Module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Environment detection - Netcup optimized
const isDevelopment = process.env.NODE_ENV !== "production";
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0'; // Generic container/host deployment

console.log(`🚀 HELIX Regulatory Informationsplattform`);
console.log(`📍 Environment: ${isDevelopment ? 'development' : 'production'}`);
console.log(`🔗 Binding to: ${HOST}:${PORT}`);

// Enhanced CORS for production
app.use(cors({
  origin: isDevelopment ? true : [
    'https://helix.deltaways.de',
    'https://regulatory.deltaways.de',
    /\.deltaways\.de$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
}));

// Enhanced security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (!isDevelopment) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Enhanced request parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Response Sanitization Middleware (entfernt verbotene KI/AI Begriffe aus allen JSON Antworten)
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    try {
      const sanitized = sanitizeObjectDeep(body);
      return originalJson(sanitized);
    } catch (e) {
      console.warn('Sanitization failed, sending original body:', (e as any)?.message);
      return originalJson(body);
    }
  };
  next();
});

// Health check endpoint - HIGHEST PRIORITY
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: isDevelopment ? 'development' : 'production',
    port: PORT,
    host: HOST,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: isDevelopment ? 'development' : 'production',
    services: ['database', 'apis', 'cache'],
    version: '2.0.0'
  });
});

// API routes setup with enhanced error handling
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Initialize daily sync scheduler for live data sources (NON-BLOCKING)
setImmediate(() => {
  dailySyncScheduler.startScheduledSync()
    .then(() => console.log('✅ Daily sync scheduler started successfully'))
    .catch(error => console.error('⚠️ Daily sync scheduler failed:', error));
});

// Ensure ALL regulatory data sources exist on startup - comprehensive global coverage
setImmediate(async () => {
  try {
    const { storage } = await import('./storage.js');
    const allRegulatorySources = [
      // USA - FDA (Comprehensive)
      { id: 'fda_pma', name: 'FDA PMA Database', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm', type: 'regulatory', status: 'active', region: 'US', country: 'US' },
      { id: 'fda_510k', name: 'FDA 510(k) Database', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm', type: 'regulatory', status: 'active', region: 'US', country: 'US' },
      { id: 'fda_maude', name: 'FDA MAUDE Adverse Events', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfmaude/search.cfm', type: 'regulatory', status: 'active', region: 'US', country: 'US' },
      { id: 'fda_recalls', name: 'FDA Medical Device Recalls', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm', type: 'regulatory', status: 'active', region: 'US', country: 'US' },
      { id: 'fda_enforcement', name: 'FDA Enforcement Reports', url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts', type: 'regulatory', status: 'active', region: 'US', country: 'US' },
      { id: 'fda_guidance', name: 'FDA Guidance Documents', url: 'https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance/guidance-documents-medical-devices-and-radiation-emitting-products', type: 'regulatory', status: 'active', region: 'US', country: 'US' },
      { id: 'fda_safety', name: 'FDA Safety Communications', url: 'https://www.fda.gov/medical-devices/safety-communications', type: 'regulatory', status: 'active', region: 'US', country: 'US' },

      // Europa - EMA & EU
      { id: 'ema_epar', name: 'EMA EPAR Database', url: 'https://www.ema.europa.eu/en/medicines/human/EPAR', type: 'regulatory', status: 'active', region: 'EU', country: 'EU' },
      { id: 'ema_news', name: 'EMA News & Updates', url: 'https://www.ema.europa.eu/en/news', type: 'regulatory', status: 'active', region: 'EU', country: 'EU' },
      { id: 'ema_safety', name: 'EMA Safety Updates', url: 'https://www.ema.europa.eu/en/human-regulatory/post-authorisation/pharmacovigilance', type: 'regulatory', status: 'active', region: 'EU', country: 'EU' },
      { id: 'ec_nando', name: 'EU NANDO Notified Bodies', url: 'https://ec.europa.eu/growth/tools-databases/nando/', type: 'regulatory', status: 'active', region: 'EU', country: 'EU' },
      { id: 'eudamed', name: 'EU EUDAMED Database', url: 'https://ec.europa.eu/health/medical-devices-eudamed_en', type: 'regulatory', status: 'active', region: 'EU', country: 'EU' },

      // Deutschland
      { id: 'bfarm', name: 'BfArM Germany', url: 'https://www.bfarm.de', type: 'regulatory', status: 'active', region: 'EU', country: 'DE' },
      { id: 'bfarm_news', name: 'BfArM Aktuelle Meldungen', url: 'https://www.bfarm.de/DE/Home/_node.html', type: 'regulatory', status: 'active', region: 'EU', country: 'DE' },
      { id: 'dimdi', name: 'DIMDI Medical Devices', url: 'https://www.dimdi.de/dynamic/de/medizinprodukte/', type: 'regulatory', status: 'active', region: 'EU', country: 'DE' },

      // UK
      { id: 'mhra', name: 'MHRA UK', url: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency', type: 'regulatory', status: 'active', region: 'UK', country: 'GB' },
      { id: 'mhra_alerts', name: 'MHRA Drug Safety Updates', url: 'https://www.gov.uk/drug-safety-update', type: 'regulatory', status: 'active', region: 'UK', country: 'GB' },
      { id: 'mhra_devices', name: 'MHRA Medical Device Alerts', url: 'https://www.gov.uk/drug-device-alerts', type: 'regulatory', status: 'active', region: 'UK', country: 'GB' },

      // Kanada
      { id: 'health_canada', name: 'Health Canada Medical Devices', url: 'https://health-products.canada.ca/api/medical-devices/', type: 'regulatory', status: 'active', region: 'Americas', country: 'CA' },
      { id: 'health_canada_recalls', name: 'Health Canada Recalls', url: 'https://recalls-rappels.canada.ca/en', type: 'regulatory', status: 'active', region: 'Americas', country: 'CA' },
      { id: 'health_canada_notices', name: 'Health Canada Safety Notices', url: 'https://www.canada.ca/en/health-canada/services/drugs-health-products/medeffect-canada/health-product-advisories.html', type: 'regulatory', status: 'active', region: 'Americas', country: 'CA' },

      // Schweiz
      { id: 'swissmedic', name: 'Swissmedic', url: 'https://www.swissmedic.ch', type: 'regulatory', status: 'active', region: 'EU', country: 'CH' },
      { id: 'swissmedic_news', name: 'Swissmedic News', url: 'https://www.swissmedic.ch/swissmedic/en/home/news.html', type: 'regulatory', status: 'active', region: 'EU', country: 'CH' },

      // Japan
      { id: 'pmda', name: 'PMDA Japan', url: 'https://www.pmda.go.jp/english/', type: 'regulatory', status: 'active', region: 'Asia', country: 'JP' },
      { id: 'pmda_approvals', name: 'PMDA New Approvals', url: 'https://www.pmda.go.jp/english/review-services/reviews/0002.html', type: 'regulatory', status: 'active', region: 'Asia', country: 'JP' },
      { id: 'pmda_safety', name: 'PMDA Safety Information', url: 'https://www.pmda.go.jp/english/safety/info-services/0001.html', type: 'regulatory', status: 'active', region: 'Asia', country: 'JP' },

      // Australien
      { id: 'tga', name: 'TGA Australia', url: 'https://www.tga.gov.au', type: 'regulatory', status: 'active', region: 'Oceania', country: 'AU' },
      { id: 'tga_alerts', name: 'TGA Safety Alerts', url: 'https://www.tga.gov.au/news/safety-alerts', type: 'regulatory', status: 'active', region: 'Oceania', country: 'AU' },
      { id: 'tga_artg', name: 'TGA ARTG Database', url: 'https://www.tga.gov.au/artg', type: 'regulatory', status: 'active', region: 'Oceania', country: 'AU' },

      // China
      { id: 'nmpa', name: 'NMPA China', url: 'https://www.nmpa.gov.cn', type: 'regulatory', status: 'active', region: 'Asia', country: 'CN' },
      { id: 'nmpa_approvals', name: 'NMPA Medical Device Approvals', url: 'https://www.nmpa.gov.cn/yaowen/ypjgyw/', type: 'regulatory', status: 'active', region: 'Asia', country: 'CN' },

      // Singapur
      { id: 'hsa', name: 'HSA Singapore', url: 'https://www.hsa.gov.sg', type: 'regulatory', status: 'active', region: 'Asia', country: 'SG' },
      { id: 'hsa_alerts', name: 'HSA Safety Alerts', url: 'https://www.hsa.gov.sg/announcements/safety-alerts', type: 'regulatory', status: 'active', region: 'Asia', country: 'SG' },

      // Brasilien
      { id: 'anvisa', name: 'ANVISA Brazil', url: 'https://www.gov.br/anvisa', type: 'regulatory', status: 'active', region: 'Americas', country: 'BR' },
      { id: 'anvisa_news', name: 'ANVISA News', url: 'https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa', type: 'regulatory', status: 'active', region: 'Americas', country: 'BR' },

      // Indien
      { id: 'cdsco', name: 'CDSCO India', url: 'https://cdsco.gov.in', type: 'regulatory', status: 'active', region: 'Asia', country: 'IN' },
      { id: 'cdsco_alerts', name: 'CDSCO Safety Alerts', url: 'https://cdsco.gov.in/opencms/opencms/en/Safety-Alerts/', type: 'regulatory', status: 'active', region: 'Asia', country: 'IN' },

      // Südkorea
      { id: 'mfds', name: 'MFDS South Korea', url: 'https://www.mfds.go.kr/eng/', type: 'regulatory', status: 'active', region: 'Asia', country: 'KR' },
      { id: 'mfds_news', name: 'MFDS News', url: 'https://www.mfds.go.kr/eng/brd/m_65/list.do', type: 'regulatory', status: 'active', region: 'Asia', country: 'KR' },

      // WHO & Global
      { id: 'who', name: 'WHO Global', url: 'https://www.who.int', type: 'regulatory', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'who_alerts', name: 'WHO Medical Product Alerts', url: 'https://www.who.int/teams/regulation-prequalification/incidents-and-SF/medical-product-alerts', type: 'regulatory', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'who_guidance', name: 'WHO Guidance Documents', url: 'https://www.who.int/health-topics/medical-devices', type: 'regulatory', status: 'active', region: 'Global', country: 'GLOBAL' },

      // Standards & Harmonisierung
      { id: 'imdrf', name: 'IMDRF International', url: 'https://www.imdrf.org', type: 'regulatory', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'iso_medical', name: 'ISO Medical Device Standards', url: 'https://www.iso.org/committee/54892.html', type: 'regulatory', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'iec_medical', name: 'IEC Medical Equipment Standards', url: 'https://www.iec.ch', type: 'regulatory', status: 'active', region: 'Global', country: 'GLOBAL' },

      // Zusätzliche EU-Länder
      { id: 'ansm', name: 'ANSM France', url: 'https://ansm.sante.fr', type: 'regulatory', status: 'active', region: 'EU', country: 'FR' },
      { id: 'aifa', name: 'AIFA Italy', url: 'https://www.aifa.gov.it', type: 'regulatory', status: 'active', region: 'EU', country: 'IT' },
      { id: 'aemps', name: 'AEMPS Spain', url: 'https://www.aemps.gob.es', type: 'regulatory', status: 'active', region: 'EU', country: 'ES' },
      { id: 'lareb', name: 'Lareb Netherlands', url: 'https://www.lareb.nl', type: 'regulatory', status: 'active', region: 'EU', country: 'NL' },
      { id: 'infarmed', name: 'INFARMED Portugal', url: 'https://www.infarmed.pt', type: 'regulatory', status: 'active', region: 'EU', country: 'PT' },

      // Nordische Länder
      { id: 'fimea', name: 'Fimea Finland', url: 'https://www.fimea.fi', type: 'regulatory', status: 'active', region: 'EU', country: 'FI' },
      { id: 'lakemedelsverket', name: 'Läkemedelsverket Sweden', url: 'https://www.lakemedelsverket.se', type: 'regulatory', status: 'active', region: 'EU', country: 'SE' },
      { id: 'dkma', name: 'DKMA Denmark', url: 'https://laegemiddelstyrelsen.dk', type: 'regulatory', status: 'active', region: 'EU', country: 'DK' },
      { id: 'noma', name: 'NOMA Norway', url: 'https://legemiddelverket.no', type: 'regulatory', status: 'active', region: 'EU', country: 'NO' },

      // Naher Osten
      { id: 'sfda_sa', name: 'SFDA Saudi Arabia', url: 'https://www.sfda.gov.sa', type: 'regulatory', status: 'active', region: 'Middle East', country: 'SA' },
      { id: 'dha_uae', name: 'DHA UAE', url: 'https://www.dha.gov.ae', type: 'regulatory', status: 'active', region: 'Middle East', country: 'AE' },

      // Südamerika
      { id: 'anmat', name: 'ANMAT Argentina', url: 'https://www.argentina.gob.ar/anmat', type: 'regulatory', status: 'active', region: 'Americas', country: 'AR' },
      { id: 'cofepris', name: 'COFEPRIS Mexico', url: 'https://www.gob.mx/cofepris', type: 'regulatory', status: 'active', region: 'Americas', country: 'MX' },

      // Afrika
      { id: 'sahpra', name: 'SAHPRA South Africa', url: 'https://www.sahpra.org.za', type: 'regulatory', status: 'active', region: 'Africa', country: 'ZA' },

      // Research & Clinical Trials
      { id: 'clinicaltrials', name: 'ClinicalTrials.gov', url: 'https://clinicaltrials.gov', type: 'research', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'eudract', name: 'EU Clinical Trials Register', url: 'https://www.clinicaltrialsregister.eu', type: 'research', status: 'active', region: 'EU', country: 'EU' },
      { id: 'pubmed', name: 'PubMed Medical Research', url: 'https://pubmed.ncbi.nlm.nih.gov', type: 'research', status: 'active', region: 'Global', country: 'GLOBAL' },

      // PATENTS - Global Patent Databases
      { id: 'uspto', name: 'USPTO United States Patent Office', url: 'https://www.uspto.gov', type: 'patents', status: 'active', region: 'US', country: 'US' },
      { id: 'uspto_search', name: 'USPTO Patent Search', url: 'https://ppubs.uspto.gov/pubwebapp/', type: 'patents', status: 'active', region: 'US', country: 'US' },
      { id: 'epo', name: 'European Patent Office (EPO)', url: 'https://www.epo.org', type: 'patents', status: 'active', region: 'EU', country: 'EU' },
      { id: 'espacenet', name: 'Espacenet Patent Search', url: 'https://worldwide.espacenet.com', type: 'patents', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'wipo', name: 'WIPO Patent Database', url: 'https://www.wipo.int/portal/en/', type: 'patents', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'patentscope', name: 'WIPO PATENTSCOPE', url: 'https://patentscope.wipo.int', type: 'patents', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'dpma', name: 'DPMA German Patent Office', url: 'https://www.dpma.de', type: 'patents', status: 'active', region: 'EU', country: 'DE' },
      { id: 'depatisnet', name: 'DEPATISnet Patent Search', url: 'https://depatisnet.dpma.de', type: 'patents', status: 'active', region: 'EU', country: 'DE' },
      { id: 'jpo', name: 'JPO Japan Patent Office', url: 'https://www.jpo.go.jp', type: 'patents', status: 'active', region: 'Asia', country: 'JP' },
      { id: 'cnipa', name: 'CNIPA China Patent Office', url: 'https://www.cnipa.gov.cn', type: 'patents', status: 'active', region: 'Asia', country: 'CN' },
      { id: 'kipo', name: 'KIPO Korean Patent Office', url: 'https://www.kipo.go.kr', type: 'patents', status: 'active', region: 'Asia', country: 'KR' },
      { id: 'ip_australia', name: 'IP Australia Patents', url: 'https://www.ipaustralia.gov.au', type: 'patents', status: 'active', region: 'Oceania', country: 'AU' },
      { id: 'cipo', name: 'CIPO Canadian Patent Office', url: 'https://www.ic.gc.ca/eic/site/cipointernet-internetopic.nsf/eng/home', type: 'patents', status: 'active', region: 'Americas', country: 'CA' },
      { id: 'ukipo', name: 'UK Intellectual Property Office', url: 'https://www.gov.uk/government/organisations/intellectual-property-office', type: 'patents', status: 'active', region: 'UK', country: 'GB' },
      { id: 'google_patents', name: 'Google Patents', url: 'https://patents.google.com', type: 'patents', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'lens_patents', name: 'Lens.org Patent Database', url: 'https://www.lens.org/lens/search/patent/list', type: 'patents', status: 'active', region: 'Global', country: 'GLOBAL' },

      // LEGAL CASES - Medical Device & Pharma Litigation
      { id: 'pacer', name: 'PACER Federal Court Cases', url: 'https://pacer.uscourts.gov', type: 'legal', status: 'active', region: 'US', country: 'US' },
      { id: 'justia', name: 'Justia Case Law', url: 'https://law.justia.com', type: 'legal', status: 'active', region: 'US', country: 'US' },
      { id: 'courtlistener', name: 'CourtListener Legal Database', url: 'https://www.courtlistener.com', type: 'legal', status: 'active', region: 'US', country: 'US' },
      { id: 'leagle', name: 'Leagle Legal Search', url: 'https://www.leagle.com', type: 'legal', status: 'active', region: 'US', country: 'US' },
      { id: 'casetext', name: 'Casetext Legal Research', url: 'https://casetext.com', type: 'legal', status: 'active', region: 'US', country: 'US' },
      { id: 'bailii', name: 'BAILII UK & Ireland Cases', url: 'https://www.bailii.org', type: 'legal', status: 'active', region: 'UK', country: 'GB' },
      { id: 'canlii', name: 'CanLII Canadian Legal Database', url: 'https://www.canlii.org', type: 'legal', status: 'active', region: 'Americas', country: 'CA' },
      { id: 'austlii', name: 'AustLII Australian Legal Database', url: 'http://www.austlii.edu.au', type: 'legal', status: 'active', region: 'Oceania', country: 'AU' },
      { id: 'eur_lex', name: 'EUR-Lex EU Law Database', url: 'https://eur-lex.europa.eu', type: 'legal', status: 'active', region: 'EU', country: 'EU' },
      { id: 'curia', name: 'CURIA EU Court Cases', url: 'https://curia.europa.eu', type: 'legal', status: 'active', region: 'EU', country: 'EU' },
      { id: 'bverfg', name: 'BVerfG German Constitutional Court', url: 'https://www.bundesverfassungsgericht.de', type: 'legal', status: 'active', region: 'EU', country: 'DE' },
      { id: 'bgh', name: 'BGH German Federal Court', url: 'https://www.bundesgerichtshof.de', type: 'legal', status: 'active', region: 'EU', country: 'DE' },
      { id: 'juris', name: 'juris German Legal Database', url: 'https://www.juris.de', type: 'legal', status: 'active', region: 'EU', country: 'DE' },
      { id: 'legifrance', name: 'Légifrance French Legal Database', url: 'https://www.legifrance.gouv.fr', type: 'legal', status: 'active', region: 'EU', country: 'FR' },
      { id: 'supremecourt', name: 'US Supreme Court Decisions', url: 'https://www.supremecourt.gov', type: 'legal', status: 'active', region: 'US', country: 'US' },
      { id: 'findlaw', name: 'FindLaw Legal Resources', url: 'https://www.findlaw.com', type: 'legal', status: 'active', region: 'US', country: 'US' },

      // PROJECT MANAGEMENT & STANDARDS
      { id: 'iso_standards', name: 'ISO International Standards', url: 'https://www.iso.org/standards.html', type: 'standards', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'iec_standards', name: 'IEC Electrotechnical Standards', url: 'https://www.iec.ch/homepage', type: 'standards', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'astm', name: 'ASTM International Standards', url: 'https://www.astm.org', type: 'standards', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'din', name: 'DIN German Standards', url: 'https://www.din.de', type: 'standards', status: 'active', region: 'EU', country: 'DE' },
      { id: 'bsi_standards', name: 'BSI British Standards', url: 'https://www.bsigroup.com', type: 'standards', status: 'active', region: 'UK', country: 'GB' },
      { id: 'ansi', name: 'ANSI American Standards', url: 'https://www.ansi.org', type: 'standards', status: 'active', region: 'US', country: 'US' },
      { id: 'cen_cenelec', name: 'CEN-CENELEC EU Standards', url: 'https://www.cencenelec.eu', type: 'standards', status: 'active', region: 'EU', country: 'EU' },
      { id: 'aami', name: 'AAMI Medical Device Standards', url: 'https://www.aami.org', type: 'standards', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'nist', name: 'NIST Standards & Technology', url: 'https://www.nist.gov', type: 'standards', status: 'active', region: 'US', country: 'US' },

      // RECALL & SAFETY MONITORING
      { id: 'safecar', name: 'NHTSA SaferCar Recalls', url: 'https://www.nhtsa.gov/recalls', type: 'safety', status: 'active', region: 'US', country: 'US' },
      { id: 'cpsc', name: 'CPSC Consumer Product Safety', url: 'https://www.cpsc.gov', type: 'safety', status: 'active', region: 'US', country: 'US' },
      { id: 'rapex', name: 'EU RAPEX Safety Alerts', url: 'https://ec.europa.eu/safety-gate', type: 'safety', status: 'active', region: 'EU', country: 'EU' },

      // INDUSTRY NEWS & INTELLIGENCE
      { id: 'meddeviceonline', name: 'Medical Device Online', url: 'https://www.meddeviceonline.com', type: 'news', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'massdevice', name: 'MassDevice News', url: 'https://www.massdevice.com', type: 'news', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'mddi', name: 'MDDI Medical Device & Diagnostic', url: 'https://www.mddionline.com', type: 'news', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'devicetalk', name: 'DeviceTalks Industry News', url: 'https://www.devicetalks.com', type: 'news', status: 'active', region: 'Global', country: 'GLOBAL' },
      { id: 'regulatory_focus', name: 'RAPS Regulatory Focus', url: 'https://www.raps.org/news-and-articles/news-articles', type: 'news', status: 'active', region: 'Global', country: 'GLOBAL' },
    ];

    let added = 0;
    for (const source of allRegulatorySources) {
      try {
        await storage.createDataSource(source);
        added++;
      } catch (e) {
        // Ignore conflicts (already exists)
      }
    }
    console.log(`✅ Verified ${allRegulatorySources.length} data sources (${added} newly added)`);
  } catch (error) {
    console.warn('⚠️ Could not verify data sources:', error);
  }
});

// Start 30-Minuten Quellen-Import Scheduler
setImmediate(() => {
  startSourceImportScheduler();
});

// Auto-Seeding Guard: Wenn Kern-Tabellen leer sind und AUTO_SEED=1, führe Import-Skripte aus
setImmediate(async () => {
  if (process.env.AUTO_SEED === '1') {
    console.log('[SEED] AUTO_SEED aktiv – starte direkten Import-Zyklus');
    runImmediateImportCycle().catch(e => console.warn('[SEED] Fehler beim Import-Zyklus:', (e as any)?.message));
  }
});

// ❌ ALL MOCK/DEMO DATA SEEDING REMOVED
// Only real data from external sources (FDA, EMA, Health Canada, MHRA, etc.)

// Register all API routes
try {
  registerRoutes(app);
  console.log('✅ API routes registered successfully');
} catch (error) {
  console.error('❌ Critical error registering routes:', error);
  process.exit(1);
}

// Production vs Development setup
if (!isDevelopment) {
  console.log('📦 Production mode: Serving built static files');
  // Uses dist/public via serveStatic helper (Vite build output)
  serveStatic(app);
} else {
  console.log('🔧 Development mode: Setting up Vite dev server');
  setupVite(app, server).catch(error => {
    console.error('❌ Vite setup failed:', error);
  });
}

// Enhanced global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🚨 Server error:', {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (req.path.startsWith('/api/')) {
    res.status(err.status || 500).json({
      error: 'Internal server error',
      message: isDevelopment ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  } else {
    next(err);
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.path}`,
    timestamp: new Date().toISOString(),
    available: [
      '/api/health',
      '/api/dashboard/stats',
      '/api/regulatory-updates',
      '/api/rechtsprechung',
      '/api/data-sources',
      '/api/source-import/status',
      '/api/source-import/trigger (POST)'
    ]
  });
});

// Scheduler Status Endpoint
app.get('/api/source-import/status', (req, res) => {
  res.json(getSchedulerStatus());
});

// Manual Import Trigger Endpoint (Admin)
app.post('/api/source-import/trigger', async (req, res) => {
  try {
    console.log('[API] Manual import triggered');
    runImmediateImportCycle().catch(e => console.error('[API] Import error:', e));
    res.json({
      message: 'Import cycle started in background',
      checkStatus: '/api/source-import/status'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Enhanced server startup
server.listen(PORT, HOST, () => {
  console.log('');
  console.log('🎉 HELIX System Successfully Started!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
  console.log(`📊 Health Check: http://${HOST}:${PORT}/health`);
  console.log(`🔧 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
  console.log(`💾 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`⚡ Process ID: ${process.pid}`);
  console.log('');
  console.log('🏢 Engineered by DELTA WAYS - Professional MedTech Solutions');
  console.log('📱 Deployment ready - Alle plattformspezifischen Alt-Abhängigkeiten entfernt');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Enhanced graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }

    console.log('✅ Server closed successfully');
    console.log('👋 HELIX System shutdown complete');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export { app, server };
