# Global Regulatory Intelligence Source Catalog

Dieses Dokument sammelt weltweit relevante Primärquellen für regulatorische Änderungen, Leitlinien, Warnungen und Normen im MedTech/Pharma Umfeld. Es priorisiert verlässliche Kanäle mit strukturierter Datenausgabe (API/RSS/JSON). Wo keine APIs existieren, werden Scraping-Fallbacks und rechtliche Hinweise beschrieben.

## EU & EWR

| Quelle | Region | Datentyp | Zugang | Stichpunkte |
|--------|--------|----------|--------|-------------|
| European Medicines Agency (EMA) Newsroom | EU | News, Guidances, PRAC | HTML + RSS (`https://www.ema.europa.eu/en/news?_format=json`) | Drupal JSON `_format=json` liefert strukturierte Objekte mit `title`, `field_date`, `path`. Falls Response leer ⇒ HTML Scrape (`.views-row`). |
| EMA Regulatory Guidance Library | EU | Leitfäden, Fragen & Antworten | Sitemap (`https://www.ema.europa.eu/sitemap.xml`) + HTML | Filter über `?search_api_fulltext=keyword&f[0]=document-type`. Nutzung von JSON API: `https://www.ema.europa.eu/api/content/search?f[0]=field_document_type:Guideline`. |
| EU Official Journal (EUR-Lex C & L Serie) | EU | Gesetze, Durchführungsverordnungen | REST (`https://eur-lex.europa.eu/search.html?lang=en&qid=...&_format=json`) | JSON Response mit `title`, `date`, `celex`. Rate Limit moderat; Key nicht nötig. |
| European Commission Medical Devices (MDCG) Guidance | EU | MDCG Dokumente | XML Feed (`https://ec.europa.eu/health/documents/md_guidance_en?format=xml`) | Enthält `guid` URLs; alternativ HTML (`.mdcg-guidance-list__item`). |
| EUDAMED (veröffentliche Bekanntmachungen) | EU | Vigilanz, Zertifikate | REST (`https://ec.europa.eu/tools/eudamed/api/search?`) | Auth frei für `PUBLIC` Endpunkte; JSON mit Paginierung. |
| EU RAPEX / Safety Gate | EU | Produktwarnungen | JSON API (`https://webgate.ec.europa.eu/rasff-window/backend/public/search?format=json`) | Felder: `notifyingCountry`, `riskDecision`, `subject`. |

## USA

| Quelle | Datentyp | Zugang | Notizen |
|--------|----------|--------|---------|
| FDA openFDA 510(k) | Geräte Zulassungen | REST (`https://api.fda.gov/device/510k.json`) | Auth optional (`api_key`). Supports `search=decision_date:[date+TO+date]`.
| FDA PMA Approvals | Geräte | REST (`https://api.fda.gov/device/pma.json`) | Parameter analog 510k. |
| FDA Drug Safety Communications | Arznei Warnungen | RSS (`https://www.fda.gov/about-fda/contact-fda/rss-feeds/drug-safety-communications`) | Fallback: HTML `.views-row`. |
| FDA CBER Biologics | Biologika Updates | REST (`https://api.fda.gov/drug/enforcement.json`) | Filter `search=classification:"Class I"`. |
| Federal Register | Gesetze & Notices | API (`https://www.federalregister.gov/api/v1/documents.json?conditions[agency]=FDA`) | JSON mit `title`, `signing_date`. |

## Vereinigtes Königreich & Schweiz

| Quelle | Region | Zugang | Hinweise |
|--------|--------|--------|---------|
| MHRA Drug and Device News | UK | HTML (Gov.UK) + Atom Feed (`https://www.gov.uk/government/announcements.atom?departments%5B%5D=medicines-and-healthcare-products-regulatory-agency`) | Atom liefert 50 Einträge; Normales HTML via `gem-c-document-list__item`. |
| MHRA Safety Alerts & Recalls | UK | JSON API (`https://www.gov.uk/api/content/medicine-device-alerts`) | Enthält `details.body` (Gov.UK). |
| NICE Guidelines Updates | UK | RSS (`https://www.nice.org.uk/guidance/published/rss`) | Enthält `category`. |
| Swissmedic News | CH | RSS (`https://www.swissmedic.ch/rss/news_en.xml`) | stabile XML. |
| Swissmedic Human Medicines | CH | HTML (Structured table) | Use `table#news-list` + `data-date`. |

## Kanada & Lateinamerika

| Quelle | Region | Zugang | Hinweise |
|--------|--------|--------|---------|
| Health Canada Recalls & Safety Alerts | CA | JSON API (`https:// recalls-rappels.canada.ca/api/en/search/recall`) | Query `search=medical`. JSON mit `start_date`, `severity`. |
| Health Canada Guidance | CA | HTML (Canada.ca) + Sitemap (`https://www.canada.ca/en/sitemap.xml`) | Filter `data-analytics` attribut. |
| ANVISA (Brasil) | BR | OpenData API (`https://dados.anvisa.gov.br/dataset/`), z. B. `medicamentos` | Requires token optional; CSV + JSON. |
| COFEPRIS | MX | HTML (Boletines) + PDF | Offizielle Seite `https://www.gob.mx/cofepris/` mit `?page=`; Fallback: scraping. |
| INVIMA | CO | RSS (`https://www.invima.gov.co/rss-noticias?format=feed&type=rss`) | Spanish; parse `item`. |

## APAC

| Quelle | Land | Zugang | Hinweise |
|--------|------|--------|---------|
| PMDA English News | JP | HTML + CSV | Sitemap `https://www.pmda.go.jp/english/sitemap.xml`. Viele PDFs; Scrape `ul.news-list`. |
| PMDA Relief Services Alerts | JP | RSS (`https://www.pmda.go.jp/english/rss/iryo_higai_e.xml`) | Enthält `pubDate`. |
| MHLW Pharmaceutical Notices | JP | HTML (Tables) | Use search `https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/index.html`. |
| NMPA (China) | CN | JSON API (`https://www.nmpa.gov.cn/xxgk/ggtg/index.html` via AJAX `?page=`) | Response in JSONP; requires parsing, consider `axios` + eval. |
| MFDS (Korea) | KR | Open API (`https://open.mfds.go.kr/api/`), e.g. `getMedicaldeviceList` | Requires API key; returns XML/JSON. |
| TGA Australia | AU | RSS (`https://www.tga.gov.au/news?search_api_fulltext=&_format=feed`) | Provide query `?items_per_page=`. |
| HSA Singapore | SG | JSON API (`https://www.hsa.gov.sg/rss?type=press-release`) | Returns Atom; convert to JSON. |
| Medsafe New Zealand | NZ | RSS (`https://www.medsafe.govt.nz/rss/rssfeeds.asp`) | Separate feed for alerts. |

## Mittlerer Osten & Afrika

| Quelle | Region | Zugang | Hinweise |
|--------|--------|--------|---------|
| SAHPRA | Südafrika | HTML + PDF | `https://www.sahpra.org.za/category/media-releases/`. |
| SFDA | Saudi-Arabien | JSON API (`https://api.sfda.gov.sa/products/v1/recalls`) | Documented, returns JSON. |
| UAE MOHAP | VAE | RSS (`https://www.mohap.gov.ae/en/MediaCenter/News/rss`) | Multi-language. |
| WHO GHO Datasets | Global | REST (`https://ghoapi.azureedge.net/api/`) | KPIs, not textual guidance but stats. |

## Normen & Standardisierung

| Organisation | Zugang | Hinweise |
|--------------|--------|---------|
| ISO | API (`https://www.iso.org/obp/ui/#search`) via JSON `/_api-merged` (requires membership) | Offiziell nur für Mitglieder (Token). |
| IEC | FTP / XML (Paid) | Kein öffentlicher Zugang; stattdessen nationale Normeninstitute (DIN, BSI). |
| DIN | HTML (DIN Mitteilungen) | Scrape `https://www.din.de/de/din-und-ihre-partner/presse`. |
| CENELEC | RSS (`https://www.cencenelec.eu/news-and-events/news/rss`) | EU Normen. |

## Zugriffsmuster & Umgehungsstrategien (Legal)

1. **Direkte API Nutzung bevorzugen:** Minimaler Wartungsaufwand, klare Limits.
2. **Offene JSON/Drupal Endpunkte:** Viele Behörden nutzen Drupal; `?_format=json` liefert strukturierte Daten.
3. **RSS/Atom Feeds:** Intuitiv, ideal für Cron Jobs. Fallback in HTML nur wenn Feed leer.
4. **Sitemaps & Search Endpoints:** `sitemap.xml` liefert Listen; `search` Endpoints akzeptieren Filter.
5. **HTML Scraping mit Respekt:** Robots.txt prüfen; nur öffentlich freigegebene Inhalte. Keine Auth-Umgehung.
6. **PDF Extraktion:** Nach Download `pdf-lib` oder OCR Pipeline nutzen.
7. **Selenium/Playwright** nur, wenn notwendig; hohe Wartungskosten.
8. **Proxies / Mirror Sites:** Nur wenn Quelle blockiert; sicherstellen, dass Terms of Use dies erlauben.

## Implementation Blueprint

1. **Source Registry (`shared/sources.ts`)**: Alle Quellen inkl. Jurisdiktion, Endpoint, Parser Typ (API, RSS, HTML).
2. **Adapter Interface**: `scripts/adapters/{identifier}.ts` exportiert `fetchUpdates(options)`. Aggregator lädt dynamisch.
3. **Scheduler**: `scripts/run-scheduled-imports.ts` ⇒ zeitgesteuerte Ausführung per Cron (Neon Functions, GitHub Action, k8s CronJob).
4. **Metadata**: Speichere `sourceId`, `jurisdiction`, `documentType`, `language`, `confidence`.
5. **Error Telemetry**: Logging (Winston) + Slack Hook für Fehlversuche.

## Priorisierte Next Steps

1. **EMA Deep Adapter** (JSON API + Fallback) – implementieren, Tests.
2. **WHO Feed Monitoring** – Retry mit Backoff + alternative Mirror `https://www.who.int/rss-feeds/news-english.xml`.
3. **European Commission MDCG** – parse XML Feed, map `reference id` & `version`.
4. **Health Canada API** – implement importer mit Pagination.
5. **ANVISA OpenData** – CSV → JSON Transformer.
6. **NMPA (CN)** – Browserless Scrape (Playwright) wegen JS Rendering.
7. **SFDA (SA)** – JSON API import.
8. **ISO/DIN** – definieren, ob rechtlich nutzbar; ggf. Manual Upload Workflow.

## Compliance Hinweise

- **Keine Umgehung von Auth oder Paywalls.** Nur öffentlich verfügbare Endpunkte nutzen.
- **Rate Limits respektieren**; Sleep/Backoff implementieren.
- **Quelle zitieren**: Speichere `source_name`, `source_url` im Datensatz.
- **Datenschutz**: Keine personenbezogenen Daten sammeln, wenn nicht erforderlich.
- **Mehrsprachigkeit**: `language` Feld pflegen; spätere Übersetzung/LLM Summaries.

---
Letzte Aktualisierung: 2025-11-23
