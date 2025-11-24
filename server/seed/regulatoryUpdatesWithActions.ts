import { db } from "../db";
import { regulatoryUpdates } from "../../shared/schema";

export const regulatoryUpdatesWithActionsData = [
  {
    title: "FDA MDR Requirement for AI-Enabled Medical Devices",
    description: "New mandatory reporting requirements for medical devices with artificial intelligence and machine learning capabilities",
    content: `The FDA has announced new Medical Device Reporting (MDR) requirements specifically targeting AI-enabled medical devices. All manufacturers must implement new tracking and reporting systems by Q2 2026.

Key Changes:
- Enhanced post-market surveillance for AI/ML devices
- Mandatory reporting of algorithm performance deviations
- New cybersecurity vulnerability disclosure requirements
- Updated clinical validation documentation

These requirements affect all Class II and Class III devices incorporating AI/ML algorithms for diagnostic, therapeutic, or monitoring purposes.`,
    type: "regulation" as const,
    category: "AI/ML Regulation",
    deviceType: "AI-enabled diagnostic devices",
    riskLevel: "high",
    jurisdiction: "United States",
    publishedDate: new Date("2025-11-15"),
    effectiveDate: new Date("2026-06-01"),
    priority: 5,
    actionRequired: true,
    actionType: "immediate",
    actionDeadline: new Date("2026-03-31"),
    implementationGuidance: `Sofortige Maßnahmen erforderlich:

1. ASSESSMENT (bis 31.12.2025):
   - Identifizieren Sie alle AI/ML-fähigen Geräte in Ihrem Portfolio
   - Bewerten Sie aktuelle MDR-Prozesse und Gap-Analyse
   - Bestimmen Sie Ressourcenbedarf für Compliance

2. SYSTEM UPDATES (bis 31.03.2026):
   - Implementieren Sie erweiterte Tracking-Systeme
   - Aktualisieren Sie Quality Management System (QMS)
   - Entwickeln Sie neue Berichtsvorlagen

3. DOCUMENTATION (bis 31.05.2026):
   - Erstellen Sie aktualisierte Technical Files
   - Dokumentieren Sie Algorithm Performance Metrics
   - Bereiten Sie Cybersecurity-Pläne vor

4. TRAINING (laufend):
   - Schulen Sie Quality Assurance Teams
   - Implementieren Sie neue Reporting-Workflows
   - Etablieren Sie kontinuierliche Monitoring-Prozesse`,
    guidanceDocuments: [
      {
        name: "FDA Guidance: AI/ML-Based Medical Devices",
        url: "https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices",
        type: "Official Guidance",
        description: "Comprehensive FDA guidance on AI/ML device regulation"
      },
      {
        name: "MDR Reporting Template for AI Devices",
        url: "https://www.fda.gov/medical-devices/medical-device-reporting-mdr-how-report-medical-device-problems",
        type: "Template",
        description: "Updated MDR forms for AI-enabled devices"
      },
      {
        name: "Implementation Checklist",
        url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents",
        type: "Checklist",
        description: "Step-by-step compliance checklist"
      },
      {
        name: "📋 Ausfüllbar: AI/ML Device Assessment Form",
        url: "/templates/ai-ml-device-assessment-form.xlsx",
        type: "Fillable Template",
        description: "Excel-Vorlage zur Bewertung aller AI/ML-Geräte im Portfolio"
      },
      {
        name: "📋 Ausfüllbar: Algorithm Performance Tracking Sheet",
        url: "/templates/algorithm-performance-tracking.xlsx",
        type: "Fillable Template",
        description: "Excel-Vorlage für kontinuierliches Performance-Monitoring"
      },
      {
        name: "📋 Ausfüllbar: Cybersecurity Vulnerability Report",
        url: "/templates/cybersecurity-vulnerability-report.docx",
        type: "Fillable Template",
        description: "Word-Vorlage für Cybersecurity-Schwachstellenberichte"
      },
      {
        name: "📋 Ausfüllbar: MDR Incident Report Form - AI Devices",
        url: "/templates/mdr-incident-report-ai.pdf",
        type: "Fillable Template",
        description: "PDF-Formular für MDR-Meldungen bei AI-Geräten"
      },
      {
        name: "📋 Ausfüllbar: Clinical Validation Documentation Template",
        url: "/templates/clinical-validation-ai.docx",
        type: "Fillable Template",
        description: "Word-Vorlage für klinische Validierungsdokumentation"
      }
    ],
    affectedProducts: [
      "AI Diagnostic Imaging Systems",
      "ML-based Clinical Decision Support",
      "Automated ECG Analysis Devices",
      "AI-powered Patient Monitoring"
    ],
    estimatedImplementationCost: 85000,
    estimatedImplementationTime: "4-6 Monate",
    tags: ["FDA", "AI/ML", "MDR", "Compliance", "High Priority"]
  },
  {
    title: "EU MDR Article 120 Transition Extension",
    description: "Extended transition period for legacy devices under Article 120 - compliance deadline moved to May 2028",
    content: `The European Commission has announced an extension of the transition period for legacy medical devices under Article 120 of the EU MDR. The new deadline for full compliance is May 26, 2028.

This extension provides manufacturers with additional time to complete:
- Clinical evaluation updates
- Technical documentation preparation
- Notified Body assessments
- Quality management system upgrades

However, manufacturers must demonstrate active progress towards compliance and cannot simply wait until the deadline.`,
    type: "regulation" as const,
    category: "Regulatory Compliance",
    deviceType: "Legacy Medical Devices",
    riskLevel: "medium",
    jurisdiction: "European Union",
    publishedDate: new Date("2025-11-10"),
    effectiveDate: new Date("2025-11-10"),
    priority: 4,
    actionRequired: true,
    actionType: "planned",
    actionDeadline: new Date("2028-05-26"),
    implementationGuidance: `Geplante Umsetzung:

1. SOFORT (bis Q1 2026):
   - Inventarisieren Sie alle betroffenen Legacy-Geräte
   - Priorisieren Sie Geräte nach Umsatz und Risiko
   - Erstellen Sie detaillierten Umsetzungsplan

2. DOKUMENTATION (2026-2027):
   - Aktualisieren Sie klinische Bewertungen
   - Vervollständigen Sie technische Dokumentation
   - Bereiten Sie PMCF-Pläne vor

3. NOTIFIED BODY (2027-2028):
   - Beantragen Sie Notified Body Reviews
   - Führen Sie erforderliche Audits durch
   - Erhalten Sie EU MDR Zertifizierungen

Wichtig: Kontinuierliche Dokumentation des Fortschritts ist erforderlich!`,
    guidanceDocuments: [
      {
        name: "EU MDR Article 120 Guidance",
        url: "https://ec.europa.eu/health/medical-devices-sector/new-regulations/guidance-mdcg-endorsed-documents-and-other-guidance_en",
        type: "Official Guidance",
        description: "Official EU guidance on Article 120 transition"
      },
      {
        name: "MDCG 2020-13: Clinical Evaluation",
        url: "https://health.ec.europa.eu/latest-updates/mdcg-2020-13-clinical-evaluation-assessment-report-template-2020-apr_en",
        type: "Template",
        description: "Clinical evaluation report template"
      },
      {
        name: "📋 Ausfüllbar: Legacy Device Inventory Spreadsheet",
        url: "/templates/legacy-device-inventory.xlsx",
        type: "Fillable Template",
        description: "Excel-Inventarliste aller betroffenen Legacy-Geräte"
      },
      {
        name: "📋 Ausfüllbar: EU MDR Transition Timeline Planner",
        url: "/templates/eu-mdr-timeline-planner.xlsx",
        type: "Fillable Template",
        description: "Projektplan-Vorlage für MDR-Transition mit Meilensteinen"
      },
      {
        name: "📋 Ausfüllbar: Clinical Evaluation Report Template",
        url: "/templates/clinical-evaluation-report-mdr.docx",
        type: "Fillable Template",
        description: "Word-Vorlage für klinische Bewertungsberichte (MDCG 2020-13)"
      },
      {
        name: "📋 Ausfüllbar: Technical Documentation Checklist",
        url: "/templates/technical-documentation-checklist-mdr.xlsx",
        type: "Fillable Template",
        description: "Checkliste für vollständige technische Dokumentation"
      },
      {
        name: "📋 Ausfüllbar: PMCF Plan Template",
        url: "/templates/pmcf-plan-template.docx",
        type: "Fillable Template",
        description: "Post-Market Clinical Follow-up Plan Vorlage"
      },
      {
        name: "📋 Ausfüllbar: Notified Body Application Form",
        url: "/templates/notified-body-application.pdf",
        type: "Fillable Template",
        description: "PDF-Formular für Notified Body Antrag"
      }
    ],
    affectedProducts: [
      "Class IIa Medical Devices",
      "Class IIb Medical Devices",
      "Class III High-Risk Devices"
    ],
    estimatedImplementationCost: 125000,
    estimatedImplementationTime: "18-24 Monate",
    tags: ["EU MDR", "Article 120", "Legacy Devices", "Transition"]
  },
  {
    title: "ISO 13485:2025 Draft Released for Comment",
    description: "New draft of ISO 13485:2025 Quality Management Standard released - final publication expected Q3 2026",
    content: `ISO has released the draft international standard (DIS) for ISO 13485:2025, representing a major update to the quality management system standard for medical devices.

Key Updates:
- Enhanced risk management integration
- Improved software validation requirements
- Updated post-market surveillance requirements
- Stronger cybersecurity considerations
- AI/ML quality system requirements

Comment period closes March 31, 2026. Final publication expected September 2026.`,
    type: "standard" as const,
    category: "Quality Management",
    deviceType: "All Medical Devices",
    riskLevel: "medium",
    jurisdiction: "International",
    publishedDate: new Date("2025-11-05"),
    effectiveDate: new Date("2026-09-01"),
    priority: 3,
    actionRequired: true,
    actionType: "monitoring",
    actionDeadline: new Date("2027-09-01"),
    implementationGuidance: `Monitoring und Vorbereitung:

1. REVIEW PHASE (Q4 2025 - Q2 2026):
   - Reviewen Sie den Draft Standard
   - Bewerten Sie Auswirkungen auf Ihr QMS
   - Reichen Sie Kommentare ein (bis 31.03.2026)

2. PREPARATION (Q3-Q4 2026):
   - Analysieren Sie finale Version nach Veröffentlichung
   - Erstellen Sie Gap-Analyse
   - Planen Sie QMS-Updates

3. IMPLEMENTATION (2027):
   - Aktualisieren Sie QMS-Dokumentation
   - Führen Sie interne Audits durch
   - Bereiten Sie Rezertifizierung vor

Hinweis: Monitoring der Entwicklung ist ausreichend. Vollständige Umsetzung erst nach finaler Publikation erforderlich.`,
    guidanceDocuments: [
      {
        name: "ISO 13485:2025 Draft (DIS)",
        url: "https://www.iso.org/standard/59752.html",
        type: "Draft Standard",
        description: "Official draft for ISO 13485:2025"
      },
      {
        name: "Transition Planning Guide",
        url: "https://www.iso.org/committee/54892.html",
        type: "Guide",
        description: "Planning guide for ISO 13485 transition"
      },
      {
        name: "📋 Ausfüllbar: ISO 13485:2025 Gap Analysis Template",
        url: "/templates/iso-13485-2025-gap-analysis.xlsx",
        type: "Fillable Template",
        description: "Excel-Vorlage zur Analyse der Unterschiede zwischen aktueller und neuer Version"
      },
      {
        name: "📋 Ausfüllbar: QMS Update Implementation Plan",
        url: "/templates/qms-update-implementation-plan.xlsx",
        type: "Fillable Template",
        description: "Projektplan für QMS-Updates mit Verantwortlichkeiten"
      },
      {
        name: "📋 Ausfüllbar: Risk Management Process Review",
        url: "/templates/risk-management-review-iso.docx",
        type: "Fillable Template",
        description: "Word-Vorlage für Risikomanagement-Prozess-Review"
      },
      {
        name: "📋 Ausfüllbar: Software Validation Documentation",
        url: "/templates/software-validation-iso-13485.docx",
        type: "Fillable Template",
        description: "Software-Validierungsdokumentation nach neuen Anforderungen"
      },
      {
        name: "📋 Ausfüllbar: Internal Audit Checklist ISO 13485:2025",
        url: "/templates/internal-audit-checklist-2025.xlsx",
        type: "Fillable Template",
        description: "Checkliste für interne Audits nach neuer Norm"
      }
    ],
    affectedProducts: [
      "All Devices under ISO 13485 Certification"
    ],
    estimatedImplementationCost: 45000,
    estimatedImplementationTime: "6-12 Monate",
    tags: ["ISO 13485", "QMS", "Standard Update", "Quality"]
  }
];

export async function seedRegulatoryUpdatesWithActions() {
  try {
    console.log("🌱 Seeding regulatory updates with action items...");
    
    for (const update of regulatoryUpdatesWithActionsData) {
      await db.insert(regulatoryUpdates).values(update).onConflictDoNothing();
      console.log(`  ✓ Seeded: ${update.title}`);
    }
    
    console.log("✅ Successfully seeded regulatory updates with action items");
  } catch (error) {
    console.error("❌ Error seeding regulatory updates:", error);
    throw error;
  }
}
