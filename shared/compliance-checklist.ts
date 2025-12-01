// Maschinenlesbare Checklistenstruktur für Compliance Guide (EU MDR/IVDR 2025)
// Diese Datei dient als Blueprint für Self-Review, Abschluss-Checklisten und Automatisierungs-Features.
// Jede Section und jeder Schritt ist eindeutig identifizierbar und kann im Frontend als interaktive Checkliste genutzt werden.

export type ComplianceChecklistSection = {
  id: string;
  title: string;
  steps: ComplianceChecklistStep[];
};

export type ComplianceChecklistStep = {
  id: string;
  label: string;
  description?: string;
  mandatory: boolean;
  reference?: string; // Link oder Norm
};

export const complianceChecklist: ComplianceChecklistSection[] = [
  {
    id: "rollenbestimmung",
    title: "Rollenbestimmung & Produktklassifizierung",
    steps: [
      { id: "rolle-waehlen", label: "Rolle eindeutig festgelegt (Hersteller, Importeur, Händler, OBL, Bevollmächtigter, Zulieferer)", mandatory: true },
      { id: "produkt-klassifiziert", label: "Produkt nach MDR/IVDR korrekt klassifiziert (inkl. Software-Regeln)", mandatory: true },
      { id: "zweckbestimmung", label: "Zweckbestimmung und Indikationen dokumentiert", mandatory: true }
    ]
  },
  {
    id: "grundlagen",
    title: "Regulatorische Grundlagen & Gesetzesquellen",
    steps: [
      { id: "mrd-ivdr-verordnung", label: "Anwendbare EU-Verordnungen identifiziert (MDR/IVDR)", mandatory: true, reference: "https://eur-lex.europa.eu/eli/reg/2017/745" },
      { id: "mdcg-guidance", label: "Relevante MDCG-Guidance-Dokumente geprüft", mandatory: true, reference: "https://health.ec.europa.eu/medical-devices-sector/new-regulations/guidance-mdcg-endorsed-documents_en" },
      { id: "harmonisierte-normen", label: "Harmonisierte Normen und Standards identifiziert (ISO 13485, ISO 14971, IEC 62304, etc.)", mandatory: true }
    ]
  },
  {
    id: "dokumentation",
    title: "Technische Dokumentation (Annex II + III)",
    steps: [
      { id: "produktbeschreibung", label: "Produktbeschreibung & Spezifikation vollständig", mandatory: true },
      { id: "gspr-checkliste", label: "GSPR-Checkliste (Annex I) ausgefüllt und dokumentiert", mandatory: true, reference: "https://www.regdesk.co/blog/the-gspr-checklist-ensuring-compliance-with-eu-mdr-ivdr/" },
      { id: "risikomanagement", label: "Risikoanalyse & Risikomanagement nach ISO 14971 durchgeführt", mandatory: true },
      { id: "verifizierung-validierung", label: "Verifizierung & Validierung (inkl. Software, Usability, Biokompatibilität)", mandatory: true },
      { id: "klinische-bewertung", label: "Klinische/Leistungsbewertung (CER/PER) abgeschlossen", mandatory: true },
      { id: "ifu-etikettierung", label: "Gebrauchsanweisung (IFU) & Etikettierung normkonform", mandatory: true },
      { id: "udi-rueckverfolgbarkeit", label: "UDI & Rückverfolgbarkeit implementiert", mandatory: true }
    ]
  },
  {
    id: "qms",
    title: "Qualitätsmanagementsystem (ISO 13485)",
    steps: [
      { id: "qms-aufgesetzt", label: "QMS nach ISO 13485 implementiert und dokumentiert", mandatory: true },
      { id: "zertifizierung", label: "QMS-Zertifizierung durch akkreditierte Stelle erfolgt", mandatory: true },
      { id: "z-annexe", label: "Z-Annexe für MDR/IVDR geprüft und integriert", mandatory: true }
    ]
  },
  {
    id: "pms",
    title: "Post-Market Surveillance (PMS, PSUR, PMCF)",
    steps: [
      { id: "pms-plan", label: "PMS-Plan erstellt und umgesetzt", mandatory: true },
      { id: "pms-bericht", label: "PMS-Bericht/PSUR fristgerecht erstellt (je nach Klasse)", mandatory: true },
      { id: "pmcf", label: "PMCF-Maßnahmen dokumentiert (falls erforderlich)", mandatory: false }
    ]
  }
  // ...weitere Abschnitte nach Bedarf
];
