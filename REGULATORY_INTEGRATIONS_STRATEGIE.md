# REGULATORY INTEGRATIONS STRATEGIE

## 1. Quellenkatalog (Initial Priorität)
| Quelle | Typ | Priorität | Zugriff | Format | Kommentar |
|--------|-----|----------|---------|--------|-----------|
| FDA (Guidances, 510(k), PMA) | Behörde | Hoch | Öffentliche API / HTML | JSON / HTML | Strukturierte Produkt- & Zulassungsdaten
| EMA | Behörde | Hoch | HTML / PDF | HTML / PDF | Teilweise manuelles Parsing nötig
| EU MDR / Gesetzesportal (EUR-Lex) | Gesetz | Hoch | HTML | HTML / XML | Versionierung + Konsolidierte Fassungen
| ISO / IEC Updates | Norm | Mittel | Paywall / Mitgliedschaft | HTML / PDF | Metadaten extrahieren, keine Volltexte speichern
| BfArM / DKMA / MHRA | Behörde | Mittel | HTML / PDF | HTML | Regionale Ergänzung EU
| FDA Warning Letters | Enforcement | Mittel | HTML | HTML | Hoher Impact für Compliance
| EUDAMED (Geräte / Vigilanz) | Behörde | Mittel | (Teil-Öffentlich) | CSV / Web | Verfügbarkeit teils eingeschränkt
| USPTO / WIPO / EPO Patente | Patent | Mittel | API / Bulk | XML / JSON | Verknüpfung zu Produkt-Roadmaps
| DIN Gesetzesverweise | Norm | Niedrig | Paywall | HTML / PDF | Sekundär für deutsche Spezifika
| WHO Medizinprodukte | Global | Niedrig | HTML | HTML | Frühwarnindikatoren

## 2. Abrufmethoden / Adapter-Typen
| Methode | Einsatzfall | Tools / Libs | Retry Strategie |
|---------|------------|--------------|----------------|
| REST API Pull | FDA APIs, Patent APIs | fetch / axios | Exponentielles Backoff (max 5 Versuche) |
| HTML Scraping | EMA, EUR-Lex, Warning Letters | Cheerio / Playwright (Headless) | Fehlgeschlagene Seiten queue + tägliches Reprocessing |
| PDF Extraktion | Leitlinien / Norm-Ankündigungen | pdf-parse / Tika | Hash-Vergleich vor Neuverarbeitung |
| RSS / Atom Feeds | Behördliche News / Newsletter | rss-parser | Automatischer Zeitstempelvergleich |
| Bulk Files | Patente (USPTO) | Streaming Parser | Segmentierung in Batches |

## 3. Update-Frequenzen (Empfohlen)
| Quelle | Pull Intervall | Delta Erkennung | Notfall / Ad-hoc |
|--------|----------------|-----------------|-----------------|
| FDA Zulassungen | stündlich | published_date + K-Nummer Hash | Manuell Trigger |
| FDA Guidances | täglich | Titel + URL Hash | Manuell |
| EMA | täglich | Dokument-URL + Titel Hash | Manuell |
| EUR-Lex Gesetz | wöchentlich | Versionskennung / konsolidierte Fassung | Manuell |
| ISO / IEC | monatlich | Standardcode + Revisionsnummer | Manuell (Veröffentlichungsmonitor) |
| Warning Letters | täglich | Letter-ID + Datum | Manuell |
| Patente | täglich | Publikationsnummer | Manuell |

## 4. Delta / Versionierung
- Jede geladene Einheit erhält `base_id` (stabile Identität) + `revision`.
- Hash-Felder (z. B. SHA256 über normalisierte Kerndaten) → Duplikaterkennung.
- Wenn Hash neu ≠ letzter Hash → neue Revision anlegen, alte Revision `status = 'superseded'` setzen.
- Materialized View `current_regulatory_updates` für schnelle Anfrage.

## 5. Fehler- & Qualitätsmanagement
| Fehlerart | Behandlung | Persistenz |
|-----------|-----------|------------|
| Netzwerkfehler | Retry (Backoff) | Import Log (`metadata.error`) |
| Parsingfehler | Markierung + manueller Review | Separater `import_errors` Table |
| Duplikat | Verwerfen / Statistik erhöhen | Counter `duplicate_count` pro Quelle |
| Inkonsistente Daten (fehlendes Datum) | Temporär speichern mit Flag | `is_incomplete = true` |

## 6. Technische Adapter-Schnittstellen (Pseudo-Code)
```ts
interface SourceAdapter {
  sourceKey: string;
  fetchRaw(deltaSince?: Date): Promise<RawRecord[]>;
  normalize(raw: RawRecord): NormalizedRecord; // map -> { base_id, title, dates, jurisdiction, ... }
  detectDelta?(raw: RawRecord, lastHash?: string): boolean;
}
```
- Registrierung der Adapter in einer Factory: `getAdapter(sourceKey)`.
- Scheduler iteriert aktive Quellen (`sources.is_active = true`).

## 7. Scheduler Workflow (vereinfacht)
```
FOR each active source
  adapter = getAdapter(source)
  raw = adapter.fetchRaw(last_successful_sync)
  FOR each record IN raw
     normalized = adapter.normalize(record)
     hash = computeHash(normalized)
     IF hash != lastStoredHash(base_id) THEN
        INSERT revision
        UPDATE previous revision -> superseded
        ENQUEUE impact-evaluation job
     ENDIF
  END
  UPDATE sources.last_sync
END
```

## 8. Impact-Bewertung (automatisiert)
Regelbasierter erster Schritt + optional KI:
```
IF type = 'regulation' AND risk_level = 'high' THEN priority = 5
IF effective_date < NOW() + 60d AND action_required THEN escalate = true
IF standard_code LIKE 'ISO 13485%' THEN process_impact = true
```
- Automatische Analyse (OpenAI / lokale Modelle) ergänzt `keyPoints`, `recommendations` (bereits Feld vorhanden in `regulatory_updates`).

## 9. Benachrichtigungen
| Ereignis | Kanal | Verzögerung |
|----------|-------|------------|
| Neue High-Risk Revision | Email + Dashboard Badge | Sofort |
| Überfällige Maßnahmen | Täglicher Digest | 08:00 Lokalzeit |
| Nächste Frist < 14 Tage | Reminder Email | 14/7/3 Tage |
| Fehlgeschlagener Import | Slack / Log Dashboard | Sofort |

## 10. Sicherheit & Rate Limiting
- API Calls throttle: pro Quelle konfigurierbar (`sync_frequency`).
- Scraping mit Rotating User-Agent + Pause zwischen Requests.
- Audit-Eintrag bei manueller Triggerung.

## 11. Beispiel: FDA Adapter Skizze
```ts
class FdaClearanceAdapter implements SourceAdapter {
  sourceKey = 'fda_510k';
  async fetchRaw(deltaSince?: Date) {
    const url = deltaSince
      ? `https://api.fda.gov/device/510k.json?search=decision_date:[${deltaSince.toISOString()}+TO+NOW]`
      : `https://api.fda.gov/device/510k.json?limit=100`;
    const res = await fetch(url);
    const json = await res.json();
    return json.results ?? [];
  }
  normalize(raw: any) {
    return {
      base_id: raw.k_number,
      title: raw.applicant + ' ' + raw.device_name,
      published_date: raw.decision_date,
      jurisdiction: 'US',
      type: 'approval',
      fda_k_number: raw.k_number,
      fda_applicant: raw.applicant,
      fda_device_class: raw.device_class,
      description: raw.device_name,
    };
  }
}
```

## 12. Datenqualitätsmetriken
| Metrik | Ziel | Berechnung |
|--------|------|------------|
| Import-Erfolgsrate | > 95% | erfolgreiche / gestartete Jobs |
| Duplikatquote | < 3% | duplikate / neue Revisionen |
| Latenz neue Revision | < 2h | Zeit zwischen Quelle und Persistenz |
| Vollständigkeitsgrad | > 90% | Datensätze ohne `is_incomplete` |

## 13. Rollout Reihenfolge
1. Adapter Grundgerüst + FDA 510(k) + MDR Basis.
2. EMA + Warning Letters.
3. Normänderungen ISO 13485 / IEC 62304.
4. Gesetzliche Artikel-Änderungen detailreich.
5. Impact-Engine + KI Empfehlungen.
6. Dashboard Eskalationen + KPI.

## 14. Monitoring / Logs
- Tabelle `import_jobs` (optional) → status, duration, error.
- Prometheus Metriken: `regulatory_import_duration_seconds`, `regulatory_import_errors_total`.
- Dashboard Tiles für: letzte Sync Zeit / Fehlerquote.

## 15. Offene Punkte
- API-Limits FDA (Frequenz testen).
- Automatische Kostenabschätzung für Analyse.
- Umgang mit Paywall-Inhalten (nur Metadaten speichern).

---
Nächste Schritte: Backend Endpoint Spezifikation (Schritt 4).
