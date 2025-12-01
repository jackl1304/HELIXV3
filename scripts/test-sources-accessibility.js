const axios = require('axios');

const sources = [
  // EU
  'https://www.ema.europa.eu/en/news?_format=json',
  'https://www.ema.europa.eu/sitemap.xml',
  'https://www.ema.europa.eu/api/content/search?f[0]=field_document_type:Guideline',
  'https://eur-lex.europa.eu/search.html?lang=en&qid=123456789&_format=json',
  'https://ec.europa.eu/health/documents/md_guidance_en?format=xml',
  'https://ec.europa.eu/tools/eudamed/api/search?query=test',
  'https://webgate.ec.europa.eu/rasff-window/backend/public/search?format=json',
  // USA
  'https://api.fda.gov/device/510k.json',
  'https://api.fda.gov/device/pma.json',
  'https://www.fda.gov/about-fda/contact-fda/rss-feeds/drug-safety-communications',
  'https://api.fda.gov/drug/enforcement.json',
  'https://www.federalregister.gov/api/v1/documents.json?conditions[agency]=FDA',
  // UK & CH
  'https://www.gov.uk/government/announcements.atom?departments%5B%5D=medicines-and-healthcare-products-regulatory-agency',
  'https://www.gov.uk/api/content/medicine-device-alerts',
  'https://www.nice.org.uk/guidance/published/rss',
  'https://www.swissmedic.ch/rss/news_en.xml',
  // CA & LA
  'https://recalls-rappels.canada.ca/api/en/search/recall',
  'https://www.canada.ca/en/sitemap.xml',
  'https://dados.anvisa.gov.br/dataset/',
  'https://www.gob.mx/cofepris/',
  'https://www.invima.gov.co/rss-noticias?format=feed&type=rss',
  // APAC
  'https://www.pmda.go.jp/english/sitemap.xml',
  'https://www.pmda.go.jp/english/rss/iryo_higai_e.xml',
  'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/index.html',
  'https://www.nmpa.gov.cn/xxgk/ggtg/index.html',
  'https://open.mfds.go.kr/api/',
  'https://www.tga.gov.au/news?search_api_fulltext=&_format=feed',
  'https://www.hsa.gov.sg/rss?type=press-release',
  'https://www.medsafe.govt.nz/rss/rssfeeds.asp',
  // Middle East & Africa
  'https://www.sahpra.org.za/category/media-releases/',
  'https://api.sfda.gov.sa/products/v1/recalls',
  'https://www.mohap.gov.ae/en/MediaCenter/News/rss',
  'https://ghoapi.azureedge.net/api/',
  // Norms
  'https://www.iso.org/obp/ui/#search',
  'https://www.din.de/de/din-und-ihre-partner/presse',
  'https://www.cencenelec.eu/news-and-events/news/rss'
];

async function testSource(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    return { url, reachable: true, status: response.status, contentLength: response.data ? response.data.length : 0 };
  } catch (error) {
    return { url, reachable: false, error: error.message };
  }
}

async function main() {
  const results = [];
  for (const url of sources) {
    console.log(`Testing ${url}...`);
    const result = await testSource(url);
    results.push(result);
    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const reachable = results.filter(r => r.reachable);
  const unreachable = results.filter(r => !r.reachable);

  console.log('\n=== Reachable Sources ===');
  reachable.forEach(r => console.log(`${r.url}: Status ${r.status}, Content Length: ${r.contentLength}`));

  console.log('\n=== Unreachable Sources ===');
  unreachable.forEach(r => console.log(`${r.url}: Error - ${r.error}`));

  // For unreachable, try to get content if possible, but since unreachable, perhaps note from catalog
  console.log('\n=== Unreachable with Potential Content Notes ===');
  unreachable.forEach(r => {
    console.log(`${r.url}: ${r.error}`);
    // Add notes from catalog if any
  });
}

main().catch(console.error);
