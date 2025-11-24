import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  customType
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom type for pgvector embeddings
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

// Enums for Helix Regulatory Intelligence system
export const statusEnum = pgEnum("status", ["active", "inactive", "pending", "archived"]);
export const updateTypeEnum = pgEnum("update_type", ["regulation", "guidance", "standard", "approval", "alert"]);
export const chatMessageTypeEnum = pgEnum("chat_message_type", ["message", "feature_request", "bug_report", "question", "feedback"]);
export const chatMessageStatusEnum = pgEnum("chat_message_status", ["unread", "read", "resolved", "in_progress"]);

// Tenants table for multi-tenant isolation
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subdomain: varchar("subdomain").unique().notNull(),
  customDomain: varchar("custom_domain"),
  logo: varchar("logo"),
  colorScheme: varchar("color_scheme").default("blue"), // blue, purple, green
  settings: jsonb("settings"),
  subscriptionTier: varchar("subscription_tier").default("standard"), // standard, premium, enterprise
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tenants_subdomain").on(table.subdomain),
  index("idx_tenants_active").on(table.isActive),
]);

// User roles enum with strict tenant isolation
export const userRoleEnum = pgEnum("user_role", ["tenant_admin", "tenant_user", "super_admin"]);

// Users table for authentication and management with tenant isolation
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  name: varchar("name"),
  role: userRoleEnum("role").default("tenant_user"),
  passwordHash: varchar("password_hash"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_email_tenant").on(table.email, table.tenantId),
  index("idx_users_tenant").on(table.tenantId),
]);

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { mode: "date" }).notNull(),
}, (table) => [
  index("idx_sessions_expire").on(table.expire),
]);

// Data sources table (FDA, EMA, BfArM, etc.)
export const dataSources = pgTable("data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  url: varchar("url"),
  apiEndpoint: varchar("api_endpoint"),
  country: varchar("country"),
  region: varchar("region"),
  type: varchar("type").notNull(), // "regulatory", "standards", "legal"
  category: varchar("category"),
  language: varchar("language").default("en"),
  isActive: boolean("is_active").default(true),
  isHistorical: boolean("is_historical").default(false),
  lastSync: timestamp("last_sync"),
  syncFrequency: varchar("sync_frequency").default("daily"),
  authRequired: boolean("auth_required").default(false),
  apiKey: varchar("api_key"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_data_sources_country").on(table.country),
  index("idx_data_sources_type").on(table.type),
  index("idx_data_sources_active").on(table.isActive),
]);

// Regulatory updates table with tenant isolation
export const regulatoryUpdates = pgTable("regulatory_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  sourceId: varchar("source_id").references(() => dataSources.id),
  title: text("title").notNull(),
  hashedTitle: varchar("hashed_title"), // Normalisierte Titel-Hash für schnelle Dedup
  description: text("description"),
  content: text("content"),
  type: updateTypeEnum("type").default("regulation"),
  category: varchar("category"),
  deviceType: varchar("device_type"),
  riskLevel: varchar("risk_level"),
  therapeuticArea: varchar("therapeutic_area"),
  documentUrl: varchar("document_url"),
  sourceUrl: varchar("source_url"),
  documentId: varchar("document_id"),
  publishedDate: timestamp("published_date"),
  effectiveDate: timestamp("effective_date"),
  jurisdiction: varchar("jurisdiction"),
  language: varchar("language").default("en"),
  tags: text("tags").array(),
  priority: integer("priority").default(1),
  isProcessed: boolean("is_processed").default(false),
  processingNotes: text("processing_notes"),

  // Action Required & Implementation Guidance
  actionRequired: boolean("action_required").default(false),
  actionType: varchar("action_type"), // immediate, planned, optional, monitoring
  actionDeadline: timestamp("action_deadline"),
  implementationGuidance: text("implementation_guidance"),
  guidanceDocuments: jsonb("guidance_documents"), // Array of {name, url, type, description}
  affectedProducts: text("affected_products").array(),
  estimatedImplementationCost: integer("estimated_implementation_cost"),
  estimatedImplementationTime: varchar("estimated_implementation_time"),

  // FDA-Specific Fields (510k, PMA, etc.)
  fdaKNumber: varchar("fda_k_number"),
  fdaApplicant: varchar("fda_applicant"),
  fdaProductCode: varchar("fda_product_code"),
  fdaDeviceClass: varchar("fda_device_class"), // I, II, III
  fdaRegulationNumber: varchar("fda_regulation_number"),
  fdaDecisionDate: timestamp("fda_decision_date"),
  fdaStatus: varchar("fda_status"),

  // Financial Analysis
  riskScore: integer("risk_score"), // 0-100
  successProbability: integer("success_probability"), // 0-100%
  implementationCostBreakdown: jsonb("implementation_cost_breakdown"), // {rd, compliance, regulatory, manufacturing, marketing}
  timeToMarketMonths: varchar("time_to_market_months"), // e.g. "14-18"
  roiProjection: jsonb("roi_projection"), // {year1: {revenue, profit}, year2: {revenue, profit}}
  paybackMonths: integer("payback_months"),

  // Automatische Analyse
  keyPoints: text("key_points").array(),
  impacts: text("impacts"),
  recommendations: text("recommendations"),

  // Authority Verification & Official Recommendations (No automated content)
  authorityVerified: boolean("authority_verified").default(false), // True wenn aus Primärquelle direkt übernommen
  authorityRecommendations: text("authority_recommendations"), // Original-Wortlaut offizieller Empfehlung / Hinweis
  costDataAvailable: boolean("cost_data_available").default(false), // True falls echte behördliche/amtliche Kostendaten zugeordnet

  // Vector Embeddings for RAG/Semantic Search (OpenAI text-embedding-3-small = 1536 dimensions)
  // embedding: vector("embedding"), // Deaktiviert: Neon DB benötigt pgvector extension

  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_regulatory_updates_tenant").on(table.tenantId),
  index("idx_regulatory_updates_source").on(table.sourceId),
  index("idx_regulatory_updates_type").on(table.type),
  index("idx_regulatory_updates_published").on(table.publishedDate),
  index("idx_regulatory_updates_priority").on(table.priority),
  index("idx_regulatory_updates_hashed_title").on(table.hashedTitle),
]);

// Legal cases table with tenant isolation
export const legalCases = pgTable("legal_cases", {
  id: text("id").primaryKey(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  caseNumber: text("case_number"),
  title: text("title").notNull(),
  court: text("court").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  source: text("source"), // Origin system e.g. courtlistener, eu_curia, fda_enforcement
  decisionDate: timestamp("decision_date", { mode: "date" }),
  summary: text("summary"),
  content: text("content"),
  verdict: text("verdict"), // Urteilsspruch - Full court ruling/judgment text
  damages: text("damages"), // Schadensersatz - Compensation/damages awarded
  documentUrl: text("document_url"),
  sourceUrl: text("source_url"),
  impactLevel: text("impact_level"),
  keywords: text("keywords").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_legal_cases_tenant").on(table.tenantId),
  index("idx_legal_cases_jurisdiction").on(table.jurisdiction),
  index("idx_legal_cases_court").on(table.court),
  index("idx_legal_cases_decision").on(table.decisionDate),
  index("idx_legal_cases_source").on(table.source),
]);

// Patents table - Global patent data from USPTO, WIPO, EPO, SureChemBL
export const patents = pgTable("patents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publicationNumber: varchar("publication_number").unique().notNull(),
  title: text("title").notNull(),
  abstract: text("abstract"),
  applicant: varchar("applicant"),
  inventors: text("inventors").array(),
  publicationDate: timestamp("publication_date"),
  filingDate: timestamp("filing_date"),
  status: varchar("status").default("pending"), // granted, pending, abandoned, expired
  jurisdiction: varchar("jurisdiction"), // US, EP, WO, etc.
  ipcCodes: text("ipc_codes").array(), // International Patent Classification
  cpcCodes: text("cpc_codes").array(), // Cooperative Patent Classification
  forwardCitations: integer("forward_citations").default(0),
  backwardCitations: integer("backward_citations").default(0),
  documentUrl: varchar("document_url"),
  sourceUrl: varchar("source_url"),
  patentFamily: text("patent_family").array(), // Related patents
  therapeuticArea: varchar("therapeutic_area"), // Oncology, Cardiology, etc.
  deviceType: varchar("device_type"), // Implant, Diagnostic, Surgical, etc.
  chemicalStructure: varchar("chemical_structure"), // SMILES or ChemBL ID
  source: varchar("source").notNull(), // USPTO, WIPO, EPO, SureChemBL
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_patents_jurisdiction").on(table.jurisdiction),
  index("idx_patents_status").on(table.status),
  index("idx_patents_source").on(table.source),
  index("idx_patents_device_type").on(table.deviceType),
  index("idx_patents_therapeutic").on(table.therapeuticArea),
  index("idx_patents_publication").on(table.publicationDate),
]);

// Knowledge base articles
export const knowledgeArticles = pgTable("knowledge_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  category: varchar("category"),
  tags: text("tags").array(),
  author: varchar("author"),
  status: statusEnum("status").default("active"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  lastReviewed: timestamp("last_reviewed"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_knowledge_articles_category").on(table.category),
  index("idx_knowledge_articles_status").on(table.status),
  index("idx_knowledge_articles_published").on(table.publishedAt),
]);

// Newsletter system
export const newsletters = pgTable("newsletters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  htmlContent: text("html_content"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  status: varchar("status").default("draft"), // draft, scheduled, sent, failed
  recipientCount: integer("recipient_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_newsletters_status").on(table.status),
  index("idx_newsletters_scheduled").on(table.scheduledAt),
]);

// Newsletter subscribers
export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  name: varchar("name"),
  organization: varchar("organization"),
  interests: text("interests").array(),
  isActive: boolean("is_active").default(true),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_subscribers_email").on(table.email),
  index("idx_subscribers_active").on(table.isActive),
]);

// Approval workflow
export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemType: varchar("item_type").notNull(), // "newsletter", "article", "update"
  itemId: varchar("item_id").notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected
  requestedBy: varchar("requested_by").references(() => users.id),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  comments: text("comments"),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_approvals_status").on(table.status),
  index("idx_approvals_type").on(table.itemType),
  index("idx_approvals_requested").on(table.requestedAt),
]);

// Chat Board für Tenant-Administrator-Kommunikation (Testphase)
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  senderId: varchar("sender_id").references(() => users.id),
  senderType: varchar("sender_type").notNull(), // "tenant", "admin"
  senderName: varchar("sender_name").notNull(),
  senderEmail: varchar("sender_email").notNull(),
  messageType: chatMessageTypeEnum("message_type").default("message"),
  subject: varchar("subject"),
  message: text("message").notNull(),
  status: chatMessageStatusEnum("status").default("unread"),
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  attachments: jsonb("attachments"), // URLs zu Anhängen
  metadata: jsonb("metadata"),
  readAt: timestamp("read_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_chat_messages_tenant").on(table.tenantId),
  index("idx_chat_messages_status").on(table.status),
  index("idx_chat_messages_type").on(table.messageType),
  index("idx_chat_messages_created").on(table.createdAt),
]);

// Chat Conversations für Thread-basierte Kommunikation
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  subject: varchar("subject").notNull(),
  status: varchar("status").default("open"), // open, closed, resolved
  priority: varchar("priority").default("normal"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  messageCount: integer("message_count").default(0),
  participantIds: text("participant_ids").array(), // User IDs beteiligt
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_chat_conversations_tenant").on(table.tenantId),
  index("idx_chat_conversations_status").on(table.status),
  index("idx_chat_conversations_last_message").on(table.lastMessageAt),
]);

// Relations
export const dataSourcesRelations = relations(dataSources, ({ many }) => ({
  regulatoryUpdates: many(regulatoryUpdates),
}));

export const regulatoryUpdatesRelations = relations(regulatoryUpdates, ({ one }) => ({
  dataSource: one(dataSources, {
    fields: [regulatoryUpdates.sourceId],
    references: [dataSources.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  approvalsRequested: many(approvals, { relationName: "requestedApprovals" }),
  approvalsReviewed: many(approvals, { relationName: "reviewedApprovals" }),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  requestedBy: one(users, {
    fields: [approvals.requestedBy],
    references: [users.id],
    relationName: "requestedApprovals",
  }),
  reviewedBy: one(users, {
    fields: [approvals.reviewedBy],
    references: [users.id],
    relationName: "reviewedApprovals",
  }),
}));

// Chat relations
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  tenant: one(tenants, {
    fields: [chatMessages.tenantId],
    references: [tenants.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [chatConversations.tenantId],
    references: [tenants.id],
  }),
  messages: many(chatMessages),
}));

// Removed duplicate tenantsRelations - already defined above

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Create tenant insert and select schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type SelectTenant = typeof tenants.$inferSelect;

export const tenantUsers = pgTable("tenant_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", {
    length: 50
  }).$type<'admin' | 'compliance_officer' | 'analyst' | 'viewer'>().notNull().default('viewer'),
  permissions: jsonb("permissions").default(sql`'[]'`),
  dashboardConfig: jsonb("dashboard_config").default(sql`'{}'`),
  isActive: boolean("is_active").default(true),
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenantDataAccess = pgTable("tenant_data_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  dataSourceId: varchar("data_source_id"),
  allowedRegions: jsonb("allowed_regions").default(sql`'["US", "EU"]'`),
  monthlyLimit: integer("monthly_limit").default(500),
  currentUsage: integer("current_usage").default(0),
  lastResetAt: timestamp("last_reset_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenantDashboards = pgTable("tenant_dashboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  layoutConfig: jsonb("layout_config").default(sql`'{}'`),
  widgets: jsonb("widgets").default(sql`'[]'`),
  isDefault: boolean("is_default").default(false),
  isShared: boolean("is_shared").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tenantInvitations = pgTable("tenant_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", {
    length: 50
  }).$type<'admin' | 'compliance_officer' | 'analyst' | 'viewer'>().notNull(),
  invitedBy: varchar("invited_by").references(() => users.id).notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for Multi-Tenant Schema
export const tenantsRelations = relations(tenants, ({ many }) => ({
  tenantUsers: many(tenantUsers),
  dataAccess: many(tenantDataAccess),
  dashboards: many(tenantDashboards),
  invitations: many(tenantInvitations),
  users: many(users),
  chatMessages: many(chatMessages),
  chatConversations: many(chatConversations),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantUsers.userId],
    references: [users.id],
  }),
}));

export const tenantDashboardsRelations = relations(tenantDashboards, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantDashboards.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantDashboards.userId],
    references: [users.id],
  }),
}));

// Types for Multi-Tenant
export type Tenant = typeof tenants.$inferSelect;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type InsertTenantUser = typeof tenantUsers.$inferInsert;
export type TenantDashboard = typeof tenantDashboards.$inferSelect;
export type InsertTenantDashboard = typeof tenantDashboards.$inferInsert;
export type TenantInvitation = typeof tenantInvitations.$inferSelect;
export type InsertTenantInvitation = typeof tenantInvitations.$inferInsert;

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSources.$inferSelect;

export const insertRegulatoryUpdateSchema = createInsertSchema(regulatoryUpdates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRegulatoryUpdate = z.infer<typeof insertRegulatoryUpdateSchema>;
export type RegulatoryUpdate = typeof regulatoryUpdates.$inferSelect;

export const insertLegalCaseSchema = createInsertSchema(legalCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLegalCase = z.infer<typeof insertLegalCaseSchema>;
export type LegalCase = typeof legalCases.$inferSelect;

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Newsletter = typeof newsletters.$inferSelect;

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({
  id: true,
});
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
});
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvals.$inferSelect;

// Chat message schemas
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Chat conversation schemas
export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;

// ============================================================================
// BEREICH 3: DEVELOPER/ENGINEER PROJECT MANAGEMENT SYSTEM
// ============================================================================

// Project status enum
export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "in_development",
  "regulatory_review",
  "testing",
  "approval_pending",
  "approved",
  "on_hold",
  "cancelled"
]);

// Project risk level enum
export const projectRiskLevelEnum = pgEnum("project_risk_level", ["low", "medium", "high", "critical"]);

// Projects table - Main project management
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),

  // Project basics
  name: varchar("name").notNull(),
  description: text("description"),
  deviceType: varchar("device_type"),
  deviceClass: varchar("device_class"), // Class I, II, III
  intendedUse: text("intended_use"),
  therapeuticArea: varchar("therapeutic_area"),

  // Regulatory pathway
  regulatoryPathwayId: varchar("regulatory_pathway_id"), // Reference to chosen regulatory route
  targetMarkets: text("target_markets").array(), // ["US", "EU", "Canada"]

  // Project status
  status: projectStatusEnum("status").default("planning"),
  riskLevel: projectRiskLevelEnum("risk_level").default("medium"),
  priority: integer("priority").default(1),

  // Timeline
  startDate: timestamp("start_date"),
  targetSubmissionDate: timestamp("target_submission_date"),
  estimatedApprovalDate: timestamp("estimated_approval_date"),
  actualCompletionDate: timestamp("actual_completion_date"),

  // Cost analysis
  estimatedCostTotal: integer("estimated_cost_total"),
  estimatedCostDevelopment: integer("estimated_cost_development"),
  estimatedCostRegulatory: integer("estimated_cost_regulatory"),
  estimatedCostTesting: integer("estimated_cost_testing"),
  actualCostTotal: integer("actual_cost_total"),

  // AI-generated insights
  similarDevicesFound: jsonb("similar_devices_found"), // Array of existing similar devices
  regulatoryRequirements: jsonb("regulatory_requirements"), // Auto-generated requirements
  complianceChecklist: jsonb("compliance_checklist"), // Auto-generated checklist
  riskAssessment: jsonb("risk_assessment"), // AI-generated risk analysis

  // Metadata
  tags: text("tags").array(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_projects_tenant").on(table.tenantId),
  index("idx_projects_user").on(table.userId),
  index("idx_projects_status").on(table.status),
  index("idx_projects_device_type").on(table.deviceType),
]);

// Project documents table
export const projectDocuments = pgTable("project_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name").notNull(),
  description: text("description"),
  documentType: varchar("document_type"), // "form", "report", "specification", "test_result", etc.
  fileUrl: varchar("file_url"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),

  // Auto-generated or uploaded
  isAutoGenerated: boolean("is_auto_generated").default(false),
  templateId: varchar("template_id"), // Reference to form template

  // Document content (for forms/templates)
  content: jsonb("content"), // Structured form data

  version: varchar("version").default("1.0"),
  status: varchar("status").default("draft"), // draft, review, approved, archived

  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_project_documents_project").on(table.projectId),
  index("idx_project_documents_tenant").on(table.tenantId),
  index("idx_project_documents_type").on(table.documentType),
]);

// Project notes table
export const projectNotes = pgTable("project_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

  title: varchar("title"),
  content: text("content").notNull(),
  noteType: varchar("note_type").default("general"), // general, meeting, decision, issue, idea

  // Tagging and organization
  tags: text("tags").array(),
  isPinned: boolean("is_pinned").default(false),

  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_project_notes_project").on(table.projectId),
  index("idx_project_notes_user").on(table.userId),
  index("idx_project_notes_pinned").on(table.isPinned),
]);

// Project requirements table - AI-generated regulatory requirements
export const projectRequirements = pgTable("project_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

  requirementType: varchar("requirement_type").notNull(), // regulatory, technical, testing, documentation
  category: varchar("category"), // FDA 510k, CE Mark, ISO 13485, etc.
  title: varchar("title").notNull(),
  description: text("description"),

  // Compliance tracking
  status: varchar("status").default("pending"), // pending, in_progress, completed, not_applicable
  priority: integer("priority").default(1),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),

  // AI-generated or manual
  isAutoGenerated: boolean("is_auto_generated").default(true),
  sourceRegulation: varchar("source_regulation"), // Reference to regulation that generated this

  // Related documents
  relatedDocuments: text("related_documents").array(),

  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_project_requirements_project").on(table.projectId),
  index("idx_project_requirements_status").on(table.status),
  index("idx_project_requirements_type").on(table.requirementType),
]);

// Form templates table - Pre-filled regulatory forms
export const formTemplates = pgTable("form_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category"), // FDA, EMA, ISO, CE_Mark, etc.
  formType: varchar("form_type"), // 510k, PMA, CE_Technical_File, etc.

  // Template structure
  fields: jsonb("fields").notNull(), // Array of form field definitions
  validationRules: jsonb("validation_rules"),

  // AI auto-fill configuration
  autoFillMapping: jsonb("auto_fill_mapping"), // Maps fields to data sources

  version: varchar("version").default("1.0"),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false), // Available to all tenants

  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_form_templates_tenant").on(table.tenantId),
  index("idx_form_templates_category").on(table.category),
  index("idx_form_templates_active").on(table.isActive),
]);

// ============================================================================
// REGULATORY PATHWAYS & BENCHMARK DATA (Based on real 2025 data)
// ============================================================================

// Regulatory pathway enum
export const regulatoryPathwayTypeEnum = pgEnum("regulatory_pathway_type", [
  "fda_510k",
  "fda_pma",
  "fda_de_novo",
  "eu_mdr_class_i",
  "eu_mdr_class_iia",
  "eu_mdr_class_iib",
  "eu_mdr_class_iii",
  "iso_13485",
  "iso_14971",
  "canada_class_ii",
  "canada_class_iii",
  "canada_class_iv"
]);

// Regulatory pathways table - Contains real benchmark data from FDA, EU MDR, ISO standards
export const regulatoryPathways = pgTable("regulatory_pathways", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  name: varchar("name").notNull(), // "FDA 510(k) Clearance", "EU MDR Class III"
  type: regulatoryPathwayTypeEnum("type").notNull(),
  description: text("description"),

  // Market/Jurisdiction
  jurisdiction: varchar("jurisdiction").notNull(), // "US", "EU", "Canada", "Global"
  deviceClasses: text("device_classes").array(), // ["Class II", "Class III"]

  // Real benchmark data (from 2025 research)
  averageTimelineMonths: integer("average_timeline_months"), // 6-12 for 510k, 24-84 for PMA
  minTimelineMonths: integer("min_timeline_months"),
  maxTimelineMonths: integer("max_timeline_months"),

  averageCostUSD: integer("average_cost_usd"), // $31,000 for 510k, $94,000,000 for PMA
  minCostUSD: integer("min_cost_usd"),
  maxCostUSD: integer("max_cost_usd"),

  // Cost breakdown (real data)
  costBreakdown: jsonb("cost_breakdown"), // {regulatory_fees: X, testing: Y, consulting: Z, clinical_trials: W}

  // Required phases (auto-generated for projects)
  requiredPhases: jsonb("required_phases"), // Array of phase templates

  // Requirements
  clinicalDataRequired: boolean("clinical_data_required").default(false),
  notifiedBodyRequired: boolean("notified_body_required").default(false),
  qmsRequired: varchar("qms_required"), // "ISO 13485", "FDA QSR"

  // Success factors
  successRate: integer("success_rate"), // Percentage (0-100)
  commonDelays: jsonb("common_delays"), // Array of common delay factors
  criticalSuccessFactors: jsonb("critical_success_factors"),

  // Documentation
  sourceUrl: varchar("source_url"), // Link to FDA/EMA guidance
  lastUpdated: timestamp("last_updated"),

  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_regulatory_pathways_type").on(table.type),
  index("idx_regulatory_pathways_jurisdiction").on(table.jurisdiction),
]);

// Project phases table - Auto-generated based on regulatory pathway
export const projectPhases = pgTable("project_phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name").notNull(), // "Pre-Clinical Testing", "Clinical Trials", "FDA Review"
  description: text("description"),
  phaseNumber: integer("phase_number").notNull(), // 1, 2, 3, etc.

  // Timeline
  estimatedDurationDays: integer("estimated_duration_days"),
  actualDurationDays: integer("actual_duration_days"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  targetEndDate: timestamp("target_end_date"),

  // Cost
  estimatedCost: integer("estimated_cost"),
  actualCost: integer("actual_cost"),

  // Status
  status: varchar("status").default("not_started"), // not_started, in_progress, completed, blocked, skipped
  progressPercentage: integer("progress_percentage").default(0),

  // Dependencies
  dependsOnPhases: text("depends_on_phases").array(), // IDs of phases that must complete first
  blockingIssues: jsonb("blocking_issues"), // Array of issues blocking progress

  // Requirements & Deliverables
  requiredDocuments: jsonb("required_documents"), // Array of document requirements
  deliverables: jsonb("deliverables"), // Array of expected outputs
  completedDeliverables: jsonb("completed_deliverables"),

  // Auto-generated or manual
  isAutoGenerated: boolean("is_auto_generated").default(true),

  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_project_phases_project").on(table.projectId),
  index("idx_project_phases_status").on(table.status),
  index("idx_project_phases_phase_number").on(table.phaseNumber),
]);

// Relations for project system
export const projectsRelations = relations(projects, ({ one, many }) => ({
  tenant: one(tenants, { fields: [projects.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  documents: many(projectDocuments),
  notes: many(projectNotes),
  requirements: many(projectRequirements),
  phases: many(projectPhases),
}));

export const projectDocumentsRelations = relations(projectDocuments, ({ one }) => ({
  project: one(projects, { fields: [projectDocuments.projectId], references: [projects.id] }),
  tenant: one(tenants, { fields: [projectDocuments.tenantId], references: [tenants.id] }),
}));

export const projectNotesRelations = relations(projectNotes, ({ one }) => ({
  project: one(projects, { fields: [projectNotes.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectNotes.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [projectNotes.tenantId], references: [tenants.id] }),
}));

export const projectRequirementsRelations = relations(projectRequirements, ({ one }) => ({
  project: one(projects, { fields: [projectRequirements.projectId], references: [projects.id] }),
  tenant: one(tenants, { fields: [projectRequirements.tenantId], references: [tenants.id] }),
}));

export const formTemplatesRelations = relations(formTemplates, ({ one }) => ({
  tenant: one(tenants, { fields: [formTemplates.tenantId], references: [tenants.id] }),
}));

export const projectPhasesRelations = relations(projectPhases, ({ one }) => ({
  project: one(projects, { fields: [projectPhases.projectId], references: [projects.id] }),
  tenant: one(tenants, { fields: [projectPhases.tenantId], references: [tenants.id] }),
}));

// Insert schemas for project system
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const insertProjectDocumentSchema = createInsertSchema(projectDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProjectDocument = z.infer<typeof insertProjectDocumentSchema>;
export type ProjectDocument = typeof projectDocuments.$inferSelect;

export const insertProjectNoteSchema = createInsertSchema(projectNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProjectNote = z.infer<typeof insertProjectNoteSchema>;
export type ProjectNote = typeof projectNotes.$inferSelect;

export const insertProjectRequirementSchema = createInsertSchema(projectRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProjectRequirement = z.infer<typeof insertProjectRequirementSchema>;
export type ProjectRequirement = typeof projectRequirements.$inferSelect;

export const insertFormTemplateSchema = createInsertSchema(formTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFormTemplate = z.infer<typeof insertFormTemplateSchema>;
export type FormTemplate = typeof formTemplates.$inferSelect;

export const insertRegulatoryPathwaySchema = createInsertSchema(regulatoryPathways).omit({
  id: true,
  createdAt: true,
});
export type InsertRegulatoryPathway = z.infer<typeof insertRegulatoryPathwaySchema>;
export type RegulatoryPathway = typeof regulatoryPathways.$inferSelect;

export const insertProjectPhaseSchema = createInsertSchema(projectPhases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProjectPhase = z.infer<typeof insertProjectPhaseSchema>;
export type ProjectPhase = typeof projectPhases.$inferSelect;

// MDR/ISO 13485 Projektakte Tables (Medical Device Regulation Documentation)

export const projectChartaDocuments = pgTable("project_charta_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  projectNumber: varchar("project_number").unique(),
  customer: varchar("customer").notNull(),
  projectLead: varchar("project_lead").notNull(),
  engineers: text("engineers").array(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: integer("budget"),
  objectives: text("objectives"),
  successCriteria: text("success_criteria"),
  stakeholders: jsonb("stakeholders"),
  signatureDate: timestamp("signature_date"),
  status: varchar("status").default("draft"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_project_charta_project").on(table.projectId),
  index("idx_project_charta_tenant").on(table.tenantId),
]);

export const requirementsSpecifications = pgTable("requirements_specifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  requirementId: varchar("requirement_id").notNull(),
  category: varchar("category").notNull(), // Functional, Non-functional, Regulatory
  description: text("description").notNull(),
  priority: varchar("priority").notNull(), // Must, Should, Could
  source: varchar("source"),
  status: varchar("status").default("open"), // open, in_progress, completed
  verificationMethod: varchar("verification_method"),
  riskLinks: text("risk_links").array(),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_requirements_project").on(table.projectId),
  index("idx_requirements_status").on(table.status),
]);

export const riskAnalysisRecords = pgTable("risk_analysis_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  riskId: varchar("risk_id").notNull(),
  hazard: text("hazard").notNull(),
  hazardousSituation: text("hazardous_situation"),
  failureMode: text("failure_mode"),
  damageScenario: text("damage_scenario"),
  severity: integer("severity"), // 1-5
  probability: integer("probability"), // 1-5
  riskScore: integer("risk_score"),
  acceptanceCriterion: varchar("acceptance_criterion"),
  mitigationMeasures: jsonb("mitigation_measures"),
  residualSeverity: integer("residual_severity"),
  residualProbability: integer("residual_probability"),
  residualRisk: integer("residual_risk"),
  verificationMethod: varchar("verification_method"),
  status: varchar("status").default("identified"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_risk_analysis_project").on(table.projectId),
  index("idx_risk_analysis_status").on(table.status),
]);

export const designReviewProtocols = pgTable("design_review_protocols", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  reviewDate: timestamp("review_date"),
  participants: text("participants").array(),
  reviewedDocuments: text("reviewed_documents").array(),
  findings: jsonb("findings"),
  decisions: text("decisions"),
  actionItems: jsonb("action_items"),
  status: varchar("status").default("open"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_design_review_project").on(table.projectId),
]);

export const testPlans = pgTable("test_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  testId: varchar("test_id").notNull(),
  testName: varchar("test_name").notNull(),
  linkedRequirementId: varchar("linked_requirement_id"),
  linkedRiskId: varchar("linked_risk_id"),
  testMethod: varchar("test_method"),
  acceptanceCriteria: text("acceptance_criteria"),
  testEnvironment: text("test_environment"),
  requiredResources: text("required_resources"),
  responsibleTester: varchar("responsible_tester"),
  plannedDate: timestamp("planned_date"),
  status: varchar("status").default("planned"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_test_plans_project").on(table.projectId),
]);

export const testProtocols = pgTable("test_protocols", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  testId: varchar("test_id").references(() => testPlans.id),
  executionDate: timestamp("execution_date"),
  tester: varchar("tester"),
  result: varchar("result"), // Passed, Failed, Inconclusive
  measurements: jsonb("measurements"),
  observations: text("observations"),
  deviations: text("deviations"),
  attachments: text("attachments").array(),
  remarks: text("remarks"),
  signatureDate: timestamp("signature_date"),
  status: varchar("status").default("open"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_test_protocols_project").on(table.projectId),
  index("idx_test_protocols_result").on(table.result),
]);

export const usabilityTestReports = pgTable("usability_test_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  participantProfile: jsonb("participant_profile"),
  testScenarios: jsonb("test_scenarios"),
  executionDate: timestamp("execution_date"),
  observations: jsonb("observations"), // errors, severity, improvements
  status: varchar("status").default("draft"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_usability_tests_project").on(table.projectId),
]);

export const conformityDeclarations = pgTable("conformity_declarations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  manufacturerName: varchar("manufacturer_name"),
  manufacturerAddress: text("manufacturer_address"),
  productName: varchar("product_name"),
  riskClass: varchar("risk_class"),
  appliedStandards: text("applied_standards").array(),
  notifiedBodyId: varchar("notified_body_id"),
  ceMarkDate: timestamp("ce_mark_date"),
  signatoryName: varchar("signatory_name"),
  signatoryTitle: varchar("signatory_title"),
  signatureDate: timestamp("signature_date"),
  documentStatus: varchar("document_status").default("draft"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_conformity_declarations_project").on(table.projectId),
]);

export const changeRequests = pgTable("change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  changeId: varchar("change_id").notNull(),
  requestor: varchar("requestor"),
  requestDate: timestamp("request_date"),
  description: text("description"),
  rationale: text("rationale"),
  affectedDocuments: text("affected_documents").array(),
  urgency: varchar("urgency"), // Low, Medium, High, Critical
  riskAssessment: text("risk_assessment"),
  approvalStatus: varchar("approval_status").default("pending"),
  approvals: jsonb("approvals"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_change_requests_project").on(table.projectId),
  index("idx_change_requests_status").on(table.approvalStatus),
]);

export const nonConformityReports = pgTable("non_conformity_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  ncrNumber: varchar("ncr_number").notNull(),
  detectionDate: timestamp("detection_date"),
  description: text("description"),
  affectedProductProcess: text("affected_product_process"),
  immediateAction: text("immediate_action"),
  rootCauseAnalysis: text("root_cause_analysis"),
  correctionAction: text("correction_action"),
  preventionAction: text("prevention_action"),
  responsiblePerson: varchar("responsible_person"),
  closeoutDate: timestamp("closeout_date"),
  effectivenessReview: text("effectiveness_review"),
  status: varchar("status").default("open"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ncr_project").on(table.projectId),
  index("idx_ncr_status").on(table.status),
]);

export const projectClosureReports = pgTable("project_closure_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  summary: text("summary"),
  goalCompletion: jsonb("goal_completion"), // Soll vs Ist
  budgetComparison: jsonb("budget_comparison"),
  scheduleComparison: jsonb("schedule_comparison"),
  lessonsLearned: text("lessons_learned"),
  recommendations: text("recommendations"),
  openItems: jsonb("open_items"),
  handoverProtocol: text("handover_protocol"),
  closureDate: timestamp("closure_date"),
  status: varchar("status").default("draft"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_closure_reports_project").on(table.projectId),
]);

// Evaluation der einzelnen Regulatory Updates (autoritative Ableitungen ohne KI-Texte)
export const regulatoryUpdateEvaluations = pgTable("regulatory_update_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  regulatoryUpdateId: varchar("regulatory_update_id").references(() => regulatoryUpdates.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  evaluationStatus: varchar("evaluation_status").default("draft"), // draft, reviewed, finalized
  obligationSummary: text("obligation_summary"), // Verdichtete Pflichtenbeschreibung (rein aus Quelle)
  requiredActions: jsonb("required_actions"), // [{code, description, deadline?, authorityRef}]
  documentReferences: jsonb("document_references"), // [{title, url, type, clauseRef}]
  costReferenceIds: jsonb("cost_reference_ids"), // Array von cost_items IDs zur Verknüpfung
  timelineEstimateMonths: integer("timeline_estimate_months"), // integer für Gesamtzeitraum
  authoritySources: jsonb("authority_sources"), // [{name, citation, url, docId, verifiedAt}]
  verificationLog: jsonb("verification_log"), // Audit Trail der Prüfungsschritte
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_eval_update").on(table.regulatoryUpdateId),
  index("idx_eval_tenant").on(table.tenantId),
  index("idx_eval_status").on(table.evaluationStatus),
]);

// Kostenreferenzen (behördliche oder amtliche Gebühren / Kostenpositionen)
export const costItems = pgTable("cost_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  jurisdiction: varchar("jurisdiction"), // Land / Region
  authorityRef: varchar("authority_ref"), // Referenz auf Behörde/Institution
  feeType: varchar("fee_type"), // application_fee, renewal_fee, inspection_fee, etc.
  description: text("description"), // Amtliche Beschreibung oder exakter Gebührenzweck
  amountMinorUnit: integer("amount_minor_unit"), // Betrag in Minor Units (z.B. Cent)
  currency: varchar("currency"), // ISO 4217 Code
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  sourceUrl: varchar("source_url"), // Primärquellen-URL
  evidenceDocumentId: varchar("evidence_document_id"), // Interne Referenz auf hinterlegte Quelle
  verificationStatus: varchar("verification_status").default("unverified"), // unverified, verified, expired
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_cost_tenant").on(table.tenantId),
  index("idx_cost_jurisdiction").on(table.jurisdiction),
  index("idx_cost_fee_type").on(table.feeType),
  index("idx_cost_verification").on(table.verificationStatus),
]);

// Normative Aktionen (konkrete Umsetzungsmaßnahmen zu Paragraphen / Klauseln)
export const normativeActions = pgTable("normative_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  regulatoryUpdateId: varchar("regulatory_update_id").references(() => regulatoryUpdates.id, { onDelete: "cascade" }).notNull(),
  clauseRef: varchar("clause_ref"), // Referenz auf Abschnitt / Paragraph
  actionCode: varchar("action_code"), // Kurzcode für interne Verlinkung
  actionDescription: text("action_description"), // Genaue Maßnahme (quellbasiert, nicht generativ)
  requiredDocuments: jsonb("required_documents"), // [{name, type, mandatory, sourceRef}]
  dependencies: jsonb("dependencies"), // [{actionCode, type}] z.B. prerequisite
  estimatedEffortHours: integer("estimated_effort_hours"),
  authorityCategory: varchar("authority_category"), // z.B. FDA, EU, ISO
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, superseded
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_actions_update").on(table.regulatoryUpdateId),
  index("idx_actions_tenant").on(table.tenantId),
  index("idx_actions_clause").on(table.clauseRef),
  index("idx_actions_code").on(table.actionCode),
]);

// Zod schemas for new tables
import { z } from 'zod';

export const authoritySourceSchema = z.object({
  name: z.string().min(2),
  citation: z.string().min(2),
  url: z.string().url().optional(),
  docId: z.string().optional(),
  verifiedAt: z.string().datetime().optional()
});

export const requiredActionSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(2),
  deadline: z.string().datetime().optional(),
  authorityRef: z.string().optional()
});

export const requiredDocumentSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  mandatory: z.boolean().default(true),
  sourceRef: z.string().optional()
});

export const dependencySchema = z.object({
  actionCode: z.string().min(1),
  type: z.string().min(1) // prerequisite | followup | conditional
});

export const insertRegulatoryUpdateEvaluationSchema = z.object({
  regulatoryUpdateId: z.string().min(1),
  tenantId: z.string().min(1),
  evaluationStatus: z.enum(['draft','reviewed','finalized']).optional(),
  obligationSummary: z.string().min(2).optional(),
  requiredActions: z.array(requiredActionSchema).optional(),
  documentReferences: z.array(z.object({ title: z.string(), url: z.string().url(), type: z.string().optional(), clauseRef: z.string().optional() })).optional(),
  costReferenceIds: z.array(z.string()).optional(),
  timelineEstimateMonths: z.number().int().positive().optional(),
  authoritySources: z.array(authoritySourceSchema).optional(),
  verificationLog: z.array(z.object({ timestamp: z.string().datetime(), userId: z.string().optional(), action: z.string(), notes: z.string().optional() })).optional()
});

export const insertCostItemSchema = z.object({
  tenantId: z.string().min(1),
  jurisdiction: z.string().min(2),
  authorityRef: z.string().min(2),
  feeType: z.string().min(2),
  description: z.string().min(2),
  amountMinorUnit: z.number().int().nonnegative(),
  currency: z.string().length(3),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  sourceUrl: z.string().url(),
  evidenceDocumentId: z.string().optional(),
  verificationStatus: z.enum(['unverified','verified','expired']).optional()
});

export const insertNormativeActionSchema = z.object({
  tenantId: z.string().min(1),
  regulatoryUpdateId: z.string().min(1),
  clauseRef: z.string().min(1),
  actionCode: z.string().min(1),
  actionDescription: z.string().min(2),
  requiredDocuments: z.array(requiredDocumentSchema).optional(),
  dependencies: z.array(dependencySchema).optional(),
  estimatedEffortHours: z.number().int().positive().optional(),
  authorityCategory: z.string().min(2).optional(),
  verificationStatus: z.enum(['pending','verified','superseded']).optional()
});

export type InsertRegulatoryUpdateEvaluation = z.infer<typeof insertRegulatoryUpdateEvaluationSchema>;
export type InsertCostItem = z.infer<typeof insertCostItemSchema>;
export type InsertNormativeAction = z.infer<typeof insertNormativeActionSchema>;
export const insertProjectChartaSchema = createInsertSchema(projectChartaDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProjectCharta = z.infer<typeof insertProjectChartaSchema>;
export type ProjectCharta = typeof projectChartaDocuments.$inferSelect;

// AI Tasks table for background processing
export const aiTasks = pgTable("ai_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(),
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  input: jsonb("input").default(sql`'{}'`),
  output: jsonb("output"),
  error: text("error"),
  priority: varchar("priority").default("medium"),
  processingTime: integer("processing_time"),
  scheduled: boolean("scheduled").default(false),
  scheduledFor: timestamp("scheduled_for"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_tasks_status").on(table.status),
  index("idx_ai_tasks_type").on(table.type),
  index("idx_ai_tasks_scheduled").on(table.scheduledFor),
]);

export const insertAiTaskSchema = createInsertSchema(aiTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAiTask = z.infer<typeof insertAiTaskSchema>;
export type AiTask = typeof aiTasks.$inferSelect;

// ---------------------------------------------------------------------------
// Erweiterung: Tiefe regulatorische / normative / gesetzliche Änderungsstruktur
// ---------------------------------------------------------------------------

// Normänderungen (ISO / IEC / etc.)
export const normChanges = pgTable("norm_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  sourceId: varchar("source_id").references(() => dataSources.id),
  baseId: varchar("base_id").notNull(), // konstanter Identifier über Revisionen
  revision: integer("revision").notNull().default(1),
  standardCode: varchar("standard_code"), // z.B. ISO 13485
  section: varchar("section"),
  changeSummary: text("change_summary"),
  impactClass: varchar("impact_class"), // process, product, documentation, software
  publishedDate: timestamp("published_date"),
  effectiveDate: timestamp("effective_date"),
  priority: integer("priority").default(1),
  requiresGapAnalysis: boolean("requires_gap_analysis").default(false),
  status: varchar("status").default("current"),
  hash: varchar("hash"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_norm_changes_standard").on(table.standardCode),
  index("idx_norm_changes_effective").on(table.effectiveDate),
  index("idx_norm_changes_priority").on(table.priority),
]);

// Gesetzesänderungen (MDR, nationale Gesetze)
export const lawChanges = pgTable("law_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  sourceId: varchar("source_id").references(() => dataSources.id),
  baseId: varchar("base_id").notNull(),
  revision: integer("revision").notNull().default(1),
  lawCode: varchar("law_code"), // MDR 2017/745 etc.
  article: varchar("article"),
  changeDetail: text("change_detail"),
  impact: text("impact"),
  publishedDate: timestamp("published_date"),
  effectiveDate: timestamp("effective_date"),
  complianceDeadline: timestamp("compliance_deadline"),
  priority: integer("priority").default(1),
  status: varchar("status").default("current"),
  hash: varchar("hash"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_law_changes_code").on(table.lawCode),
  index("idx_law_changes_article").on(table.article),
  index("idx_law_changes_deadline").on(table.complianceDeadline),
]);

// Maßnahmen / Actions abgeleitet aus Änderungen
export const regActions = pgTable("reg_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  referenceType: varchar("reference_type").notNull(), // regulatory | norm | law
  referenceId: varchar("reference_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  ownerRole: varchar("owner_role"),
  ownerUser: varchar("owner_user"),
  dueDate: timestamp("due_date"),
  status: varchar("status").default("open"), // open,in_progress,blocked,done,verified
  riskLevel: varchar("risk_level"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reg_actions_reference").on(table.referenceId),
  index("idx_reg_actions_due").on(table.dueDate),
  index("idx_reg_actions_status").on(table.status),
]);

// Dokumente / Artefakte generisch
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  referenceType: varchar("reference_type"),
  referenceId: varchar("reference_id"),
  docType: varchar("doc_type"), // original, summary, gap_analysis, evidence
  title: varchar("title"),
  url: varchar("url"),
  storagePath: varchar("storage_path"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_documents_reference").on(table.referenceId),
  index("idx_documents_type").on(table.docType),
]);

// Impact Matrix
export const changeImpacts = pgTable("change_impacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  referenceType: varchar("reference_type"),
  referenceId: varchar("reference_id"),
  processImpact: boolean("process_impact").default(false),
  productImpact: boolean("product_impact").default(false),
  softwareImpact: boolean("software_impact").default(false),
  documentationImpact: boolean("documentation_impact").default(false),
  validationRequired: boolean("validation_required").default(false),
  requalificationRequired: boolean("requalification_required").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_change_impacts_reference").on(table.referenceId),
]);

// Audit Trail
export const auditTrail = pgTable("audit_trail", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  action: varchar("action"),
  performedBy: varchar("performed_by"),
  performedRole: varchar("performed_role"),
  before: jsonb("before"),
  after: jsonb("after"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_audit_entity").on(table.entityId),
  index("idx_audit_action").on(table.action),
  index("idx_audit_time").on(table.timestamp),
]);

