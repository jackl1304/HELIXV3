# ULTIMATE MEDTECH REGULATORY COMPLIANCE BOSS-PROMPT
Vollständiger Leitfaden für VS Code Agent – EU MDR/IVDR 2025
Version: 2.0 (Stand: Januar 2025)
Gültigkeit: EU-MDR 2017/745, EU-IVDR 2017/746
Zweck: Komplette Automatisierung aller regulatorischen Pflichten für Hersteller, Importeure, Händler, OBL, Zulieferer und Bevollmächtigte

---

## 📋 INHALTSVERZEICHNIS
1. Rollenbestimmung & Produktklassifizierung
2. Regulatorische Grundlagen & Gesetzesquellen
3. Technische Dokumentation (Annex II + III)
4. Qualitätsmanagementsystem (ISO 13485)
5. Post-Market Surveillance (PMS, PSUR, PMCF)
6. Vigilanz & Meldewesen
7. EUDAMED & UDI-Registrierung
8. Rollenspezifische Pflichten
9. Automatisiertes Monitoring & Update-System
10. Self-Review & Abschluss-Checkliste
11. Quellenverzeichnis & Ressourcen

---

## 1️⃣ ROLLENBESTIMMUNG & PRODUKTKLASSIFIZIERUNG
### 1.1 Rolle definieren
Wähle deine Rolle:
- Hersteller (Manufacturer) – Verantwortlich für Design, Herstellung, CE-Kennzeichnung
- Importeur (Importer) – Erstes Inverkehrbringen aus Drittland in EU
- Händler (Distributor) – Lieferkette innerhalb EU, keine Veränderung am Produkt
- Zulieferer (Supplier) – Lieferung von Komponenten/Dienstleistungen
- OBL/Private Label – Handelt als Hersteller, auch wenn OEM produziert
- Bevollmächtigter (Authorized Representative) – Vertritt Hersteller außerhalb EU

### 1.2 Produktklassifizierung
Klassifizierung nach MDR Anhang VIII:
- Klasse I (niedriges Risiko) → Unterklassen: Is (steril), Im (Messfunktion)
- Klasse IIa (mittleres Risiko)
- Klasse IIb (erhöhtes Risiko)
- Klasse III (hohes Risiko, implantierbar/lebenserhaltend)

Klassifizierung nach IVDR Anhang VIII:
- Klasse A (niedriges Risiko)
- Klasse B (mittleres Risiko)
- Klasse C (hohes Risiko)
- Klasse D (höchstes Risiko)

**Software-Spezifika:**
- Prüfung nach Regel 11 (MDR) für Medical Device Software (MDSW)
- Prüfung nach Regel 3 (IVDR) für IVD-Software
- IEC 62304 Compliance erforderlich
- Cybersecurity-Anforderungen gem. MDCG 2019-16

### 1.3 Zweckbestimmung & Indikationen
- Präzise Zweckbestimmung definieren (intended use/purpose)
- Indikationen, Kontraindikationen dokumentieren
- Zielgruppe (Patienten, Anwender, Umgebung) spezifizieren

---

## 2️⃣ REGULATORISCHE GRUNDLAGEN & GESETZESQUELLEN
### 2.1 Primäre Rechtsgrundlagen
EU-Verordnungen:
- MDR 2017/745 – Medical Device Regulation
  - [MDR 2017/745](https://eur-lex.europa.eu/eli/reg/2017/745)
- IVDR 2017/746 – In Vitro Diagnostic Regulation
  - [IVDR 2017/746](https://eur-lex.europa.eu/eli/reg/2017/746)

**Wichtige Änderungen 2025:**
- Artikel 10a MDR/IVDR (ab 10. Januar 2025): Meldepflicht bei Lieferunterbrechungen mindestens 6 Monate im Voraus
- IVDR-Übergangsfristen verlängert (abhängig von Geräteklasse)
- EUDAMED schrittweise Vollimplementierung

### 2.2 MDCG Guidance Documents
Offizielle EU-Leitlinien:
- MDCG 2019-11: Clinical Evaluation
- MDCG 2020-7: Post-Market Clinical Follow-up (PMCF)
- MDCG 2020-13: Clinical Evaluation Assessment Report
- MDCG 2022-21: Periodic Safety Update Report (PSUR)
- MDCG 2019-16: Cybersecurity for medical devices
- MDCG guidance zu Artikel 10a (Q&A)
- [Alle MDCG-Dokumente](https://health.ec.europa.eu/medical-devices-sector/new-regulations/guidance-mdcg-endorsed-documents_en)

### 2.3 Harmonisierte Normen (Standards)
**Qualitätsmanagement:**
- ISO 13485:2016 – QMS für Medizinprodukte (Z-Annexe für MDR/IVDR-Mapping)
- ISO 9001 (falls zusätzlich gewünscht)

**Risikomanagement:**
- ISO 14971:2019 – Risikomanagement für Medizinprodukte
- ISO 24971 (Guidance zu ISO 14971)

**Software & Cybersecurity:**
- IEC 62304 – Software-Lebenszyklus-Prozesse
- IEC 62366 – Usability Engineering
- IEC 81001-5-1 – Cybersecurity für Health Software

**Biokompatibilität:**
- ISO 10993 Serie – Biologische Beurteilung

**Sterilisation:**
- ISO 11135 (EtO), ISO 11137 (Strahlung), ISO 17665 (Dampf)

---

## 3️⃣ TECHNISCHE DOKUMENTATION (ANNEX II + III)
### 3.1 Struktur der technischen Dokumentation
Annex II MDR / Annex III IVDR – Vollständige Doku umfasst:

#### 3.1.1 Produktbeschreibung & Spezifikation
- Produktbezeichnung, Modelle, Varianten, Katalognummern
- Technische Spezifikationen (Maße, Gewicht, Materialien, Software-Version)
- Fotos, Zeichnungen, Diagramme
- Zubehör, Kombinationsprodukte

#### 3.1.2 Zweckbestimmung & GSPR
- Intended use/purpose detailliert beschrieben
- GSPR-Checkliste (General Safety & Performance Requirements)
  - Annex I MDR/IVDR mit 23 Hauptanforderungen
  - Jede Anforderung auf Anwendbarkeit prüfen
  - Nachweis der Konformität dokumentieren
  - Kreuzverweise zu Testberichten, Normen, Risikomanagement
  - [GSPR Checklist Template](https://www.regdesk.co/blog/the-gspr-checklist-ensuring-compliance-with-eu-mdr-ivdr/)

#### 3.1.3 Design & Herstellung
- Designhistorie, Entwicklungsphasen
- Bill of Materials (BOM)
- Herstellungsprozesse, Fertigungsstandorte
- Sterilisation, Verpackung, Transport

#### 3.1.4 Risikoanalyse & Risikomanagement
- Risikomanagementplan gem. ISO 14971
- Risikoanalyse (FMEA, FTA, Hazard Analysis)
- Risikobewertung & Risikominderung
- Restrisiko-Akzeptanz
- Post-Production Risk Management

#### 3.1.5 Verifizierung & Validierung
- Design Verification (funktioniert es wie geplant?)
- Design Validation (erfüllt es Nutzerbedürfnisse?)
- Software-Validierung (IEC 62304)
- Usability-Tests (IEC 62366)
- Biokompatibilitätstests (ISO 10993)
- Elektromagnetische Verträglichkeit (EMC)
- Stabilität & Shelf Life

#### 3.1.6 Klinische/Leistungsbewertung
**Für MDR:**
- Clinical Evaluation Report (CER) gem. Annex XIV Part A
- Literaturrecherche & klinische Daten
- Äquivalenznachweise (falls zutreffend)
- Benefit-Risk-Analyse

**Für IVDR:**
- Performance Evaluation Report (PER) gem. Annex XIII
- Analytische & klinische Leistungsdaten
- Scientific validity

#### 3.1.7 Gebrauchsanweisung (IFU) & Etikettierung
- IFU in allen Zielsprachen
- Etiketten gem. Annex I Kapitel III
- Warnhinweise, Kontraindikationen
- Symbole gem. ISO 15223

#### 3.1.8 UDI & Rückverfolgbarkeit
- UDI-DI (Device Identifier) zugewiesen
- UDI-PI (Production Identifier) bei Bedarf
- UDI auf Etikett, Verpackung
- Rückverfolgbarkeit über Lieferkette

---

## 4️⃣ QUALITÄTSMANAGEMENTSYSTEM (ISO 13485)
### 4.1 QMS-Anforderungen
ISO 13485:2016 Struktur:
- Kapitel 4: QMS-Anforderungen
  - Dokumentierte Verfahren & Aufzeichnungen
  - Prozesslandkarte
  - Dokumentenlenkung & Aufzeichnungskontrolle
- Kapitel 5: Verantwortung der Leitung
  - Qualitätspolitik & -ziele
  - Management Representative benannt
  - PRRC (Person Responsible for Regulatory Compliance) benannt
  - Management Review mindestens jährlich
- Kapitel 6: Ressourcenmanagement
  - Kompetenz, Schulung, Bewusstsein
  - Infrastruktur & Arbeitsumgebung
  - Saubere Räume (falls erforderlich)
- Kapitel 7: Produktrealisierung
  - Entwicklungsprozess dokumentiert
  - Design Controls (Design Input, Output, Review, Verification, Validation)
  - CAPA-Prozess (Corrective and Preventive Actions)
  - Änderungsmanagement (Change Control)
  - Beschaffung & Lieferantenbewertung
  - Produktions- & Dienstleistungserbringung
  - Identifikation & Rückverfolgbarkeit
  - Kontrolle von Überwachungs- & Messmitteln
- Kapitel 8: Messung, Analyse, Verbesserung
  - Interne Audits (mindestens jährlich)
  - Reklamations- & Beschwerdemanagement
  - Datenanalyse & KPIs
  - Kontinuierliche Verbesserung

### 4.2 QMS-Zertifizierung
- Zertifizierung durch akkreditierte Stelle (TÜV, BSI, etc.)
- Überwachungsaudits (jährlich)
- Re-Zertifizierung (alle 3 Jahre)

### 4.3 Z-Annexe für MDR/IVDR
- ISO 13485 Z-Annexe prüfen (Mapping zu MDR/IVDR-Anforderungen)
- Zusätzliche MDR/IVDR-Anforderungen in QMS integrieren

---

## 5️⃣ POST-MARKET SURVEILLANCE (PMS, PSUR, PMCF)
### 5.1 PMS-System
Anforderungen gem. Annex III MDR/IVDR:

#### 5.1.1 PMS-Plan
- PMS-Plan für alle Produkte erstellen
- Proaktive Datensammlung definieren (Literatur, Datenbanken, Kundenfeedback)
- Reaktive Datensammlung (Beschwerden, Vorkommnisse)
- Methoden & Verantwortlichkeiten festlegen

#### 5.1.2 PMS-Bericht
- PMS-Bericht für Klasse I-Geräte
- Aktualisierung bei signifikanten Änderungen oder mindestens bei Zertifikatserneuerung

#### 5.1.3 PSUR (Periodic Safety Update Report)
Für Klasse IIa, IIb, III:
- PSUR gem. Artikel 86 MDR erstellen
- Aktualisierungsfristen:
  - Klasse IIa: alle 2 Jahre
  - Klasse IIb: jährlich
  - Klasse III: jährlich
- Inhalt gemäß Vorgaben

... (weitere Kapitel wie im Prompt, ggf. fortsetzen)

---

*Letzte Aktualisierung: Januar 2025*
