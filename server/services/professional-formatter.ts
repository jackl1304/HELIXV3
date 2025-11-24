/**
 * Professional Content Formatter
 * Transforms raw scraped data into domain-expert quality content
 * Regulatory Affairs, IP Law, Quality Management terminology
 */

import type { ScrapedUpdate } from './universal-scraper';

interface FormattedContent {
  title: string;
  executive_summary: string;
  technical_details: string;
  compliance_impact: string;
  actionable_insights: string[];
  risk_category?: 'High' | 'Medium' | 'Low';
  affected_sectors?: string[];
}

export class ProfessionalFormatter {
  
  /**
   * Transform raw data into professionally formatted regulatory intelligence
   */
  formatUpdate(raw: ScrapedUpdate): FormattedContent {
    const sourceType = raw.source_id.split('_')[0];
    
    switch (sourceType) {
      case 'fda':
      case 'ema':
      case 'mhra':
      case 'tga':
        return this.formatRegulatoryUpdate(raw);
      
      case 'uspto':
      case 'epo':
      case 'wipo':
      case 'espacenet':
        return this.formatPatentUpdate(raw);
      
      case 'pacer':
      case 'courtlistener':
      case 'bailii':
      case 'canlii':
        return this.formatLegalUpdate(raw);
      
      case 'iso':
      case 'iec':
      case 'astm':
      case 'din':
        return this.formatStandardsUpdate(raw);
      
      default:
        return this.formatGenericUpdate(raw);
    }
  }
  
  /**
   * Regulatory Affairs Format (FDA, EMA, notified bodies)
   */
  private formatRegulatoryUpdate(raw: ScrapedUpdate): FormattedContent {
    const title = this.enhanceRegulatoryTitle(raw.title, raw.reference_number);
    
    const summary = this.generateRegulatorySummary(raw);
    
    const technicalDetails = `
**Submission Details**
- Reference: ${raw.reference_number || 'N/A'}
- Jurisdiction: ${this.formatJurisdiction(raw.jurisdiction)}
- Publication Date: ${this.formatDate(raw.published_date)}
- Document Type: ${raw.document_type}
- Regulatory Status: ${raw.status || 'Published'}

**Classification**
${this.extractClassificationInfo(raw)}

**Scope of Application**
${this.inferScope(raw.description, raw.title)}
    `.trim();
    
    const complianceImpact = this.assessComplianceImpact(raw);
    
    const insights = this.generateActionableInsights(raw);
    
    return {
      title,
      executive_summary: summary,
      technical_details: technicalDetails,
      compliance_impact: complianceImpact,
      actionable_insights: insights,
      risk_category: this.assessRiskLevel(raw),
      affected_sectors: this.identifyAffectedSectors(raw)
    };
  }
  
  /**
   * Patent & IP Format
   */
  private formatPatentUpdate(raw: ScrapedUpdate): FormattedContent {
    const title = `Patent ${raw.reference_number ? raw.reference_number + ': ' : ''}${raw.title}`;
    
    const summary = `
New patent publication in ${this.formatJurisdiction(raw.jurisdiction)} patent office. 
${this.extractKeyInnovation(raw.description)}

**Technical Field**: ${this.inferTechnicalField(raw.title, raw.description)}
**Priority Date**: ${this.formatDate(raw.published_date)}
**Patent Office**: ${this.getPatentOfficeName(raw.source_id)}
    `.trim();
    
    const technicalDetails = `
**Patent Information**
- Application/Publication Number: ${raw.reference_number || 'Pending assignment'}
- Filing Date: ${this.formatDate(raw.published_date)}
- Patent Office: ${this.getPatentOfficeName(raw.source_id)}
- Jurisdiction: ${this.formatJurisdiction(raw.jurisdiction)}

**Abstract**
${raw.description}

**Technology Classification**
${this.inferIPCClassification(raw.title, raw.description)}
    `.trim();
    
    const complianceImpact = `
**IP Landscape Impact**
This patent may affect freedom-to-operate analysis for medical devices in the following areas:
${this.identifyFTOImpact(raw)}

**Competitive Intelligence**
Monitor for potential licensing opportunities or design-around requirements.
    `.trim();
    
    const insights = [
      'Review for potential patent infringement risks in current product portfolio',
      'Assess licensing opportunities if technology aligns with development roadmap',
      'Include in next IP landscape analysis',
      'Monitor for continuation applications or family members in other jurisdictions'
    ];
    
    return {
      title,
      executive_summary: summary,
      technical_details: technicalDetails,
      compliance_impact: complianceImpact,
      actionable_insights: insights,
      affected_sectors: this.identifyAffectedSectors(raw)
    };
  }
  
  /**
   * Legal Case Format
   */
  private formatLegalUpdate(raw: ScrapedUpdate): FormattedContent {
    const title = `Case ${raw.reference_number ? raw.reference_number + ': ' : ''}${raw.title}`;
    
    const summary = `
Recent court decision from ${this.getCourtName(raw.source_id)} addressing medical device liability and regulatory compliance issues.

**Case Number**: ${raw.reference_number || 'N/A'}
**Jurisdiction**: ${this.formatJurisdiction(raw.jurisdiction)}
**Decision Date**: ${this.formatDate(raw.published_date)}
**Court**: ${this.getCourtName(raw.source_id)}
    `.trim();
    
    const technicalDetails = `
**Case Information**
- Docket Number: ${raw.reference_number || 'Not yet assigned'}
- Court: ${this.getCourtName(raw.source_id)}
- Filing/Decision Date: ${this.formatDate(raw.published_date)}
- Jurisdiction: ${this.formatJurisdiction(raw.jurisdiction)}

**Case Summary**
${raw.description}

**Relevant Legal Issues**
${this.extractLegalIssues(raw)}
    `.trim();
    
    const complianceImpact = `
**Regulatory Precedent Analysis**
${this.assessLegalPrecedent(raw)}

**Risk Management Considerations**
- Review quality management system for alignment with court findings
- Assess post-market surveillance procedures
- Evaluate adequacy of Instructions for Use (IFU) and warnings
- Consider impact on pending regulatory submissions
    `.trim();
    
    const insights = [
      'Circulate to Quality Assurance and Risk Management teams',
      'Review product labeling for similar devices',
      'Update complaint handling procedures if applicable',
      'Consider implications for ongoing clinical investigations'
    ];
    
    return {
      title,
      executive_summary: summary,
      technical_details: technicalDetails,
      compliance_impact: complianceImpact,
      actionable_insights: insights,
      risk_category: 'High',
      affected_sectors: this.identifyAffectedSectors(raw)
    };
  }
  
  /**
   * Standards & Quality Management Format
   */
  private formatStandardsUpdate(raw: ScrapedUpdate): FormattedContent {
    const title = `Standard ${raw.reference_number ? raw.reference_number + ': ' : ''}${raw.title}`;
    
    const summary = `
${this.getStandardType(raw.source_id)} standard update published by ${this.getStandardsBody(raw.source_id)}.

**Standard Number**: ${raw.reference_number || 'Draft'}
**Publication Date**: ${this.formatDate(raw.published_date)}
**Status**: ${raw.status || 'Published'}
**Standards Body**: ${this.getStandardsBody(raw.source_id)}
    `.trim();
    
    const technicalDetails = `
**Standard Information**
- Reference Number: ${raw.reference_number || 'Pending'}
- Publication Date: ${this.formatDate(raw.published_date)}
- Status: ${raw.status || 'Published'}
- Standards Organization: ${this.getStandardsBody(raw.source_id)}
- Scope: ${this.inferStandardScope(raw)}

**Technical Scope**
${raw.description}

**Applicability**
${this.identifyStandardApplicability(raw)}
    `.trim();
    
    const complianceImpact = `
**Quality Management System Impact**
${this.assessQMSImpact(raw)}

**Conformity Assessment**
- Review existing technical documentation for conformance
- Update Design History File (DHF) references
- Consider implications for CE marking / FDA submissions
- Plan for transition period if superseding existing standards
    `.trim();
    
    const insights = [
      'Notify Regulatory Affairs and Quality teams of standard update',
      'Schedule gap analysis against current QMS',
      'Update regulatory submission templates',
      'Plan for re-testing if required by new standard requirements'
    ];
    
    return {
      title,
      executive_summary: summary,
      technical_details: technicalDetails,
      compliance_impact: complianceImpact,
      actionable_insights: insights,
      risk_category: this.assessRiskLevel(raw),
      affected_sectors: this.identifyAffectedSectors(raw)
    };
  }
  
  /**
   * Generic Format (fallback)
   */
  private formatGenericUpdate(raw: ScrapedUpdate): FormattedContent {
    return {
      title: raw.title,
      executive_summary: raw.description,
      technical_details: `
**Source**: ${raw.source_id}
**Publication Date**: ${this.formatDate(raw.published_date)}
**Jurisdiction**: ${this.formatJurisdiction(raw.jurisdiction)}
**Reference**: ${raw.reference_number || 'N/A'}
      `.trim(),
      compliance_impact: 'Review for potential impact on regulatory strategy.',
      actionable_insights: [
        'Review full document at source',
        'Assess relevance to current product portfolio',
        'Distribute to relevant stakeholders'
      ]
    };
  }
  
  // --- Helper Methods ---
  
  private enhanceRegulatoryTitle(title: string, reference?: string): string {
    if (reference && !title.includes(reference)) {
      return `${reference}: ${title}`;
    }
    return title;
  }
  
  private generateRegulatorySummary(raw: ScrapedUpdate): string {
    const agency = this.getAgencyName(raw.source_id);
    const action = this.inferRegulatoryAction(raw.title, raw.description);
    
    return `
${agency} has published ${action} regarding ${this.extractDeviceCategory(raw.title)}.

**Key Points**:
- Reference: ${raw.reference_number || 'N/A'}
- Publication Date: ${this.formatDate(raw.published_date)}
- Jurisdiction: ${this.formatJurisdiction(raw.jurisdiction)}
- Immediate Action Required: ${this.determineUrgency(raw)}

${this.extractFirstSentence(raw.description)}
    `.trim();
  }
  
  private assessComplianceImpact(raw: ScrapedUpdate): string {
    const hasHighRisk = this.containsHighRiskKeywords(raw.title + ' ' + raw.description);
    
    if (hasHighRisk) {
      return `
**HIGH PRIORITY - Immediate Review Required**

This regulatory update may directly impact market authorization, post-market surveillance obligations, or product safety requirements.

**Recommended Actions**:
1. Immediate notification to Regulatory Affairs Director
2. Review Technical Documentation for affected devices
3. Assess need for regulatory submission updates
4. Evaluate impact on marketed products
5. Document review and decisions in Quality Management System

**Timeline**: Complete initial assessment within 5 business days.
      `.trim();
    }
    
    return `
**Standard Monitoring**

This update should be reviewed as part of routine regulatory intelligence activities.

**Recommended Actions**:
1. File in regulatory intelligence database
2. Review during quarterly regulatory horizon scanning
3. Assess relevance to current development projects
4. No immediate action required unless specific product concerns identified
    `.trim();
  }
  
  private generateActionableInsights(raw: ScrapedUpdate): string[] {
    const insights: string[] = [];
    
    const text = (raw.title + ' ' + raw.description).toLowerCase();
    
    if (text.includes('recall') || text.includes('withdrawal')) {
      insights.push('Review similar devices in portfolio for comparable risks');
      insights.push('Assess adequacy of post-market surveillance');
    }
    
    if (text.includes('guidance') || text.includes('guideline')) {
      insights.push('Update internal SOPs to align with new guidance');
      insights.push('Brief regulatory team on changes');
    }
    
    if (text.includes('510(k)') || text.includes('pma') || text.includes('ce mark')) {
      insights.push('Review submission strategy for pending applications');
      insights.push('Update regulatory templates');
    }
    
    if (text.includes('clinical') || text.includes('trial')) {
      insights.push('Share with Clinical Affairs team');
      insights.push('Assess impact on ongoing or planned studies');
    }
    
    if (insights.length === 0) {
      insights.push('Distribute to Regulatory Affairs team');
      insights.push('File for future reference');
      insights.push('Monitor for follow-up guidance');
    }
    
    return insights;
  }
  
  private assessRiskLevel(raw: ScrapedUpdate): 'High' | 'Medium' | 'Low' {
    const text = (raw.title + ' ' + raw.description).toLowerCase();
    
    const highRiskKeywords = ['recall', 'withdrawal', 'safety', 'warning', 'suspension', 'revocation', 'class i'];
    const mediumRiskKeywords = ['update', 'change', 'revision', 'guidance', 'requirement'];
    
    if (highRiskKeywords.some(kw => text.includes(kw))) return 'High';
    if (mediumRiskKeywords.some(kw => text.includes(kw))) return 'Medium';
    return 'Low';
  }
  
  private identifyAffectedSectors(raw: ScrapedUpdate): string[] {
    const text = (raw.title + ' ' + raw.description).toLowerCase();
    const sectors: string[] = [];
    
    const sectorKeywords: Record<string, string[]> = {
      'Cardiovascular': ['cardiac', 'heart', 'vascular', 'stent', 'pacemaker'],
      'Orthopedic': ['orthopedic', 'joint', 'spine', 'bone', 'implant'],
      'Diagnostic': ['diagnostic', 'imaging', 'test', 'assay', 'ivd'],
      'Surgical': ['surgical', 'instrument', 'endoscop', 'laparoscop'],
      'Patient Monitoring': ['monitor', 'sensor', 'vital signs'],
      'Respiratory': ['respiratory', 'ventilat', 'oxygen', 'breathing'],
      'Neurology': ['neuro', 'brain', 'spine', 'neural'],
      'General Medical': ['medical device', 'equipment']
    };
    
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        sectors.push(sector);
      }
    }
    
    return sectors.length > 0 ? sectors : ['General Medical Devices'];
  }
  
  // Formatting Utilities
  
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
  
  private formatJurisdiction(code?: string): string {
    const jurisdictions: Record<string, string> = {
      'US': 'United States',
      'EU': 'European Union',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'JP': 'Japan',
      'CN': 'China',
      'CA': 'Canada',
      'AU': 'Australia',
      'GLOBAL': 'International'
    };
    return jurisdictions[code || 'GLOBAL'] || code || 'International';
  }
  
  private getAgencyName(sourceId: string): string {
    const agencies: Record<string, string> = {
      'fda_pma': 'FDA Center for Devices and Radiological Health',
      'fda_510k': 'FDA CDRH',
      'ema_epar': 'European Medicines Agency',
      'mhra': 'UK Medicines and Healthcare products Regulatory Agency',
      'tga': 'Australian Therapeutic Goods Administration'
    };
    return agencies[sourceId] || 'Regulatory Authority';
  }
  
  private getPatentOfficeName(sourceId: string): string {
    const offices: Record<string, string> = {
      'uspto': 'United States Patent and Trademark Office',
      'epo': 'European Patent Office',
      'wipo': 'World Intellectual Property Organization',
      'jpo': 'Japan Patent Office',
      'cnipa': 'China National Intellectual Property Administration'
    };
    return offices[sourceId] || 'Patent Office';
  }
  
  private getCourtName(sourceId: string): string {
    const courts: Record<string, string> = {
      'pacer': 'U.S. Federal Courts',
      'courtlistener': 'U.S. Court System',
      'bailii': 'British and Irish Legal Information Institute',
      'canlii': 'Canadian Legal Information Institute'
    };
    return courts[sourceId] || 'Court';
  }
  
  private getStandardsBody(sourceId: string): string {
    const bodies: Record<string, string> = {
      'iso_standards': 'International Organization for Standardization (ISO)',
      'iec_standards': 'International Electrotechnical Commission (IEC)',
      'astm': 'ASTM International',
      'din': 'Deutsches Institut für Normung (DIN)'
    };
    return bodies[sourceId] || 'Standards Organization';
  }
  
  private getStandardType(sourceId: string): string {
    if (sourceId.includes('iso')) return 'ISO';
    if (sourceId.includes('iec')) return 'IEC';
    if (sourceId.includes('astm')) return 'ASTM';
    return 'Technical';
  }
  
  private extractFirstSentence(text: string): string {
    const match = text.match(/^[^.!?]+[.!?]/);
    return match ? match[0] : text.substring(0, 150) + '...';
  }
  
  private extractDeviceCategory(text: string): string {
    const categories = ['medical device', 'diagnostic', 'surgical instrument', 'implant', 'monitoring system'];
    for (const cat of categories) {
      if (text.toLowerCase().includes(cat)) return cat;
    }
    return 'medical technology';
  }
  
  private inferRegulatoryAction(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    if (text.includes('approval')) return 'a market authorization approval';
    if (text.includes('clearance')) return 'a 510(k) clearance';
    if (text.includes('recall')) return 'a safety recall notice';
    if (text.includes('guidance')) return 'updated regulatory guidance';
    if (text.includes('warning')) return 'a safety warning';
    return 'a regulatory update';
  }
  
  private determineUrgency(raw: ScrapedUpdate): string {
    return this.assessRiskLevel(raw) === 'High' ? 'Yes - Review within 48 hours' : 'Standard monitoring';
  }
  
  private containsHighRiskKeywords(text: string): boolean {
    const keywords = ['urgent', 'immediate', 'recall', 'class i', 'withdrawal', 'suspension', 'safety alert'];
    return keywords.some(kw => text.toLowerCase().includes(kw));
  }
  
  private extractClassificationInfo(raw: ScrapedUpdate): string {
    const text = raw.description.toLowerCase();
    if (text.includes('class iii')) return 'Class III - High Risk Device';
    if (text.includes('class ii')) return 'Class II - Moderate Risk Device';
    if (text.includes('class i')) return 'Class I - Low Risk Device';
    return 'Classification to be determined from source document';
  }
  
  private inferScope(description: string, title: string): string {
    return `Applicable to ${this.extractDeviceCategory(title + ' ' + description)} as specified in referenced document.`;
  }
  
  private extractKeyInnovation(description: string): string {
    return this.extractFirstSentence(description);
  }
  
  private inferTechnicalField(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    if (text.includes('diagnos')) return 'Diagnostic Technology';
    if (text.includes('imag')) return 'Medical Imaging';
    if (text.includes('surgical')) return 'Surgical Instruments';
    if (text.includes('implant')) return 'Implantable Devices';
    return 'Medical Technology';
  }
  
  private inferIPCClassification(title: string, description: string): string {
    return 'IPC Classification: A61 (Medical or Veterinary Science; Hygiene) - Full classification available in source document.';
  }
  
  private identifyFTOImpact(raw: ScrapedUpdate): string {
    return `
- Potential restrictions in ${this.formatJurisdiction(raw.jurisdiction)}
- Consider design alternatives for affected technology areas
- Monitor patent family status in key markets
    `.trim();
  }
  
  private extractLegalIssues(raw: ScrapedUpdate): string {
    return `
- Product liability and duty of care
- Regulatory compliance adequacy
- Post-market surveillance obligations
- Labeling and instructions for use requirements
    `.trim();
  }
  
  private assessLegalPrecedent(raw: ScrapedUpdate): string {
    return `
This case may establish precedent regarding:
- Standard of care for medical device manufacturers
- Adequacy of risk mitigation measures
- Regulatory submission completeness requirements

Manufacturers should review QMS procedures to ensure alignment with court's interpretation of regulatory obligations.
    `.trim();
  }
  
  private inferStandardScope(raw: ScrapedUpdate): string {
    const text = raw.description.toLowerCase();
    if (text.includes('test')) return 'Testing and Validation Requirements';
    if (text.includes('quality')) return 'Quality Management System Requirements';
    if (text.includes('software')) return 'Software Lifecycle Processes';
    if (text.includes('biocompatibility')) return 'Biological Evaluation';
    return 'General Requirements';
  }
  
  private identifyStandardApplicability(raw: ScrapedUpdate): string {
    return 'Applicable to medical device manufacturers subject to ISO 13485 quality management requirements.';
  }
  
  private assessQMSImpact(raw: ScrapedUpdate): string {
    return `
This standard update may require:
- Updates to quality management procedures
- Revision of design and development processes
- Enhanced verification and validation protocols
- Updated training materials for quality personnel

Gap analysis recommended within 30 days of publication.
    `.trim();
  }
}

export const professionalFormatter = new ProfessionalFormatter();
