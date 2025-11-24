# Alternative Legal Case Quellen (Stand 23.11.2025)

## Übersicht
Ergänzend zu CourtListener wurden folgende zusätzliche Quellen integriert (teilweise heuristisch / Stub) zur Erfassung von medizin-, haftungs- und gesundheitsbezogenen Entscheidungen:

| Quelle | ID | Typ | Region | Status | Hinweise |
|--------|----|-----|--------|--------|----------|
| CourtListener API | courtlistener-api | API | USA | Aktiv | Auth via Token (vollständige Opinions) |
| GovInfo USCOURTS | govinfo-uscourts | API | USA | Aktiv | Erfordert `GOVINFO_API_KEY`, Filter nach health/device Terms |
| EUR-Lex Search | eurlex-search | HTML | EU | Aktiv (Heuristik) | Schnelle Link-Extraktion, keine strukturierte Metadaten |
| EU Curia (Sample) | eu_curia | Manuell/Sample | EU | Aktiv (repräsentativ) | Kuratierte Beispiele bis vollwertige API/Scrape verfügbar |
| BAILII | bailii-scrape | HTML | UK/IE | Aktiv (Feature Flag) | AGB beachten, nur leichte Heuristik, kein Bulk-Dump |
| HUDOC (ECHR) | hudoc-search | Stub | Europa | Aktiv (Feature Flag) | Platzhalter; echte API-Abfrage später nach Spezifikation |
| FDA Enforcement | fda_enforcement_cases | API | USA | Aktiv | Schon Teil regulatorischer Sammlung, jetzt auch als Case Source |

## Environment Variablen
```
# Gerichtsdaten
COURTLISTENER_API_KEY=...       # Bereits vorhanden für CourtListener
GOVINFO_API_KEY=...             # https://api.govinfo.gov/ registrieren
ENABLE_EURLEX=true              # EUR-Lex Heuristik aktivieren
ENABLE_BAILII=false             # BAILII nur aktivieren bei genehmigter Nutzung
ENABLE_HUDOC=false              # HUDOC Stub aktivieren
```

## Feature Flags & Aktivierung
- Standardmäßig werden GovInfo (bei Key), EUR-Lex (wenn Flag), BAILII/HUDOC nur mit explizitem Flag geladen.
- Flags erlauben schrittweise Erweiterung ohne Performance-/Lizenzrisiko.

## Datenqualität & Einschränkungen
| Quelle | Qualität | Einschränkungen |
|--------|----------|-----------------|
| GovInfo | Mittel | Titel-basierter Relevanzfilter; Detailmetadaten unvollständig |
| EUR-Lex | Niedrig-Mittel | Reine Link-Heuristik; Datum/Nummern extrahieren noch rudimentär |
| BAILII | Niedrig | Struktur variiert stark; Bulk-Scraping untersagt; Auswahl begrenzt |
| HUDOC | Niedrig (Stub) | Keine realen API-Parameter bisher implementiert |

## Erweiterungsplan
1. CourtListener Pagination & Vollimport (Deduplizieren durch Hashes)
2. EUR-Lex: Umstieg auf XML/JSON Schnittstelle (falls erreichbar) oder SPARQL Query + strukturiertes Mapping
3. BAILII: Nutzung interner erlaubter API (falls verfügbar) oder Reduktion auf manuell gepflegte Liste relevanter Entscheidungen
4. GovInfo: Erweiterung um echte Datumsfelder (publicationDate), Docket Parsing
5. HUDOC: Implementierung offizieller Query Parameter (z.B. `query=medical device`) & Filter (Kategorien: Violation/No Violation)
6. Normalisierung Felder: `decision_type`, `docket_number`, `judge_panel`
7. Relevanz-Scoring mit Embeddings (Titel + Kurzbeschreibung) -> Priorisierung

## Mapping Felder (Normalized -> Source)
| Normalized | CourtListener | GovInfo | EUR-Lex | BAILII | HUDOC |
|------------|---------------|---------|--------|--------|-------|
| title | caseName/snippet | title | anchor text | anchor text | stub title |
| caseNumber | docketNumber | packageId | extrahiert Regex C-xxx | heuristisch Jahr | HUDOC-ID (zukünftig) |
| court | court / court_id | US Federal Court | CJEU/EU Courts | UK/Ireland Courts | ECHR |
| jurisdiction | USA | USA | EU | UK | EU |
| filedDate | dateFiled | n/a (set current) | current (heuristisch) | current | current |
| documentUrl | absolute_url | pdfLink/detailsLink | link href | link href | base URL (später detail) |
| sourceId | courtlistener-api | govinfo-uscourts | eurlex-search | bailii-scrape | hudoc-search |

## Lizenz & Compliance Hinweise
- BAILII: Bulk-Extraktion untersagt; nur gezielte Einzelabrufe und Metadaten-Extraktion. AGB vor produktivem Einsatz prüfen.
- HUDOC: Nutzungsbedingungen ECHR beachten, besonders bei massenhaftem Abruf.
- GovInfo: Öffentliche API, Rate Limits einhalten; Key nicht veröffentlichen.
- CourtListener: API Key geheim halten; Respektiere Rate Limits (Pagination implementieren bevor Vollimport).

## Risiko-Minimierung
- Rate Limit Backoff (bereits für CourtListener vorhanden, ausbaubar für andere Quellen)
- Dedup anhand normalisiertem Titel + Quelle + Datum
- Feature Flags reduzieren ungewollten Traffic

## Weiteres Vorgehen Vorschlag (Priorität)
1. Implementiere CourtListener Pagination (Basis für Vollbestand US) – P1
2. Einheitliche Filter in `/api/legal-cases?source=...&jurisdiction=...` – P1
3. Erweiterte Felder + Migration: `decision_type`, `docket_number`, `judge_panel` – P2
4. Relevanz-Scoring Embeddings + Anzeige Top 10 Kritische Fälle – P2
5. HUDOC echte Implementierung – P3
6. BAILII QS & Auswahl whitelist – P3

---
Maintained by HELIX Legal Intelligence.
