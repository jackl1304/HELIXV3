import Anthropic from "@anthropic-ai/sdk";
import { db } from "../storage";
import { regulatoryUpdates, dataSources } from "../../shared/schema";
import { Logger } from "./logger.service";
import { sql, eq, inArray, and, or, ilike } from "drizzle-orm";
import { callGroqChatStreaming } from "./groqService";

const logger = new Logger("AgentRouter");

// Initialize Anthropic client with OpenRouter support
let client: Anthropic | null = null;
try {
  // Unterstützt sowohl Anthropic als auch OpenRouter (für Claude)
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    logger.warn("ANTHROPIC_API_KEY not set - using Groq fallback");
  } else {
    // Prüfe ob es ein OpenRouter Key ist
    const isOpenRouter = apiKey.startsWith('sk-or-v1-');
    if (isOpenRouter) {
      // OpenRouter unterstützt Anthropic API über ihre Proxy
      client = new Anthropic({
        apiKey: apiKey,
        baseURL: 'https://openrouter.ai/api/v1'
      });
      logger.info("Using OpenRouter API for Anthropic/Claude");
    } else {
      client = new Anthropic({ apiKey });
    }
  }
} catch (error: any) {
  logger.warn("Failed to initialize Anthropic client - using Groq fallback", { error: error.message });
}

/**
 * Multi-Agent Router Service for RAG-based Regulatory Intelligence
 * Routes queries to specialized agents (FDA, EMA, Compliance, Analytics)
 */

interface RoutingDecision {
  agent: "fda" | "ema" | "health_canada" | "compliance" | "analytics" | "general";
  confidence: number;
  reasoning: string;
  parameters: Record<string, any>;
}

interface AgentResponse {
  agent: string;
  response: string;
  sources: Array<{
    title: string;
    source: string;
    date: string;
    relevanceScore: number;
  }>;
  metadata: {
    totalResultsFound: number;
    processingTimeMs: number;
  };
}

/**
 * Route user query to appropriate agent using LLM
 */
async function routeQuery(userQuery: string): Promise<RoutingDecision> {
  // Use Groq if Anthropic not available
  if (!client) {
    logger.info("Anthropic not available - using Groq for routing");
    return {
      agent: "general",
      confidence: 0.8,
      reasoning: "Groq fallback routing",
      parameters: {}
    };
  }

  const systemPrompt = `You are an intelligent query router for a regulatory intelligence platform.
Analyze the user's query and determine which specialized agent should handle it.

Agents available:
1. "fda" - FDA 510(k), PMA, recalls, device classification
2. "ema" - European Medical Device Approvals (EPAR), product authorizations
3. "health_canada" - Canadian medical device licenses and approvals
4. "compliance" - Risk assessment, compliance monitoring, regulatory gaps
5. "analytics" - Financial impact, market trends, ROI analysis
6. "general" - General regulatory information, multi-source queries

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "agent": "agent_name",
  "confidence": 0.95,
  "reasoning": "Brief explanation",
  "parameters": {
    "deviceType": "optional_device_category",
    "dateRange": "optional_date_filter"
  }
}`;

  try {
    if (!client) throw new Error("Using Groq fallback - Anthropic not available");

    const response = await client!.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userQuery,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Clean response - remove markdown code blocks if present
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }

    const routing = JSON.parse(jsonText) as RoutingDecision;
    logger.info("Query routed", {
      agent: routing.agent,
      confidence: routing.confidence,
    });

    return routing;
  } catch (error: any) {
    logger.error("Routing error", { error: error.message });
    // Fallback to general agent
    return {
      agent: "general",
      confidence: 0.5,
      reasoning: "Routing error - fallback to general agent",
      parameters: {},
    };
  }
}

/**
 * FDA Agent - Handle FDA-specific queries
 */
async function fdaAgent(
  query: string,
  _parameters: Record<string, any>
): Promise<AgentResponse> {
  const startTime = Date.now();

  // Query using correct column names
  const fdaUpdates = await db
    .select({
      id: regulatoryUpdates.id,
      title: regulatoryUpdates.title,
      description: regulatoryUpdates.description,
      sourceId: regulatoryUpdates.sourceId,
      publishedDate: regulatoryUpdates.publishedDate,
    })
    .from(regulatoryUpdates)
    .where(sql`LOWER(title) LIKE LOWER(${`%${query}%`}) OR LOWER(description) LIKE LOWER(${`%${query}%`})`)
    .orderBy(sql`published_date DESC`)
    .limit(10);

  // Get source names
  const sourceIds = fdaUpdates.map((u) => u.sourceId).filter(Boolean);
  const sourceInfo = sourceIds.length > 0
    ? await db.select().from(dataSources).where(inArray(dataSources.id, sourceIds as string[]))
    : [];

  const sourceMap = Object.fromEntries(
    sourceInfo.map((s: any) => [s.id, s.name])
  );

  const systemPrompt = `You are an FDA regulatory expert. Analyze these FDA regulatory updates and provide insights.
Focus on device classification, approval paths, and compliance requirements.`;

  const prompt = `User query: "${query}"

FDA Updates found: ${fdaUpdates.length}
${fdaUpdates
  .map(
    (row) =>
      `- ${row.title} (${sourceMap[row.sourceId || ''] || row.sourceId || 'Unknown'}) - ${row.publishedDate}`
  )
  .join("\n")}

Provide a concise, helpful analysis.`;

  // Use Groq fallback if Anthropic not available
  if (!client) {
    logger.info("FDA Agent: Using Groq fallback");
    const analysis = await callGroqChatStreaming(prompt, systemPrompt);

    return {
      agent: "FDA",
      response: analysis,
      sources: fdaUpdates
        .map((row) => ({
          title: row.title,
          source: sourceMap[row.sourceId || ''] || row.sourceId || "Unknown",
          date: row.publishedDate?.toISOString() || new Date().toISOString(),
          relevanceScore: 0.85,
        }))
        .slice(0, 3),
      metadata: {
        totalResultsFound: fdaUpdates.length,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  const analysis =
    content.type === "text" ? content.text : "Unable to analyze FDA updates";

  return {
    agent: "FDA",
    response: analysis,
    sources: fdaUpdates
      .map((row: any) => ({
        title: row.title,
        source: sourceMap[row.sourceId] || row.sourceId || "Unknown",
        date: row.publishedDate?.toISOString() || new Date().toISOString(),
        relevanceScore: 0.9,
      }))
      .slice(0, 3),
    metadata: {
      totalResultsFound: fdaUpdates.length,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

/**
 * EMA Agent - Handle European approval queries
 */
async function emaAgent(
  query: string,
  _parameters: Record<string, any>
): Promise<AgentResponse> {
  const startTime = Date.now();

  const emaUpdates = await db
    .select({
      id: regulatoryUpdates.id,
      title: regulatoryUpdates.title,
      description: regulatoryUpdates.description,
      sourceId: regulatoryUpdates.sourceId,
      publishedDate: regulatoryUpdates.publishedDate,
    })
    .from(regulatoryUpdates)
    .where(sql`LOWER(title) LIKE LOWER(${`%${query}%`}) OR LOWER(description) LIKE LOWER(${`%${query}%`})`)
    .orderBy(sql`published_date DESC`)
    .limit(10);

  const systemPrompt = `You are a European regulatory expert specializing in EMA approvals and EPAR processes.
Provide insights on device approvals, CE marking, and European compliance requirements.`;

  const prompt = `User query: "${query}"

EMA Updates found: ${emaUpdates.length}
${emaUpdates
  .map(
    (row) =>
      `- ${row.title} (Source: ${row.sourceId}) - ${row.publishedDate}`
  )
  .join("\n")}

Provide a focused analysis.`;

  // Use Groq fallback if Anthropic not available
  if (!client) {
    logger.info("EMA Agent: Using Groq fallback");
    const analysis = await callGroqChatStreaming(prompt, systemPrompt);

    return {
      agent: "EMA",
      response: analysis,
      sources: emaUpdates
        .map((row) => ({
          title: row.title,
          source: row.sourceId || "EMA",
          date: row.publishedDate?.toISOString() || new Date().toISOString(),
          relevanceScore: 0.8,
        }))
        .slice(0, 3),
      metadata: {
        totalResultsFound: emaUpdates.length,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  const analysis =
    content.type === "text" ? content.text : "Unable to analyze EMA updates";

  return {
    agent: "EMA",
    response: analysis,
    sources: emaUpdates
      .map((row: any) => ({
        title: row.title,
        source: row.sourceId || "Unknown",
        date: row.publishedDate?.toISOString() || new Date().toISOString(),
        relevanceScore: 0.85,
      }))
      .slice(0, 3),
    metadata: {
      totalResultsFound: emaUpdates.length,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

/**
 * Compliance Agent - Risk and compliance analysis
 */
async function complianceAgent(
  query: string,
  _parameters: Record<string, any>
): Promise<AgentResponse> {
  const startTime = Date.now();

  // Get all recent updates for compliance analysis
  const allUpdates = await db
    .select({
      id: regulatoryUpdates.id,
      title: regulatoryUpdates.title,
      sourceId: regulatoryUpdates.sourceId,
      publishedDate: regulatoryUpdates.publishedDate,
    })
    .from(regulatoryUpdates)
    .orderBy(sql`published_date DESC`)
    .limit(20);

  const systemPrompt = `You are a regulatory compliance expert. Analyze regulatory trends and identify compliance gaps.
Provide actionable recommendations for medical device manufacturers.`;

  const prompt = `User compliance query: "${query}"

Recent regulatory updates (last 20):
${allUpdates
  .map(
    (u: any) =>
      `- ${u.title} (Source: ${u.sourceId}) - ${u.publishedDate}`
  )
  .join("\n")}

Analyze compliance implications and provide recommendations.`;

  // Use Groq fallback if Anthropic not available
  if (!client) {
    logger.info("Compliance Agent: Using Groq fallback");
    const analysis = await callGroqChatStreaming(prompt, systemPrompt);

    return {
      agent: "Compliance",
      response: analysis,
      sources: allUpdates
        .map((u: any) => ({
          title: u.title,
          source: u.sourceId || "Unknown",
          date: u.publishedDate?.toISOString() || new Date().toISOString(),
          relevanceScore: 0.75,
        }))
        .slice(0, 3),
      metadata: {
        totalResultsFound: allUpdates.length,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1200,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  const analysis =
    content.type === "text"
      ? content.text
      : "Unable to perform compliance analysis";

  return {
    agent: "Compliance",
    response: analysis,
    sources: allUpdates
      .map((u: any) => ({
        title: u.title,
        source: u.sourceId || "Unknown",
        date: u.publishedDate?.toISOString() || new Date().toISOString(),
        relevanceScore: 0.8,
      }))
      .slice(0, 3),
    metadata: {
      totalResultsFound: allUpdates.length,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

/**
 * General Agent - Multi-source regulatory queries
 */
async function generalAgent(
  query: string,
  _parameters: Record<string, any>
): Promise<AgentResponse> {
  const startTime = Date.now();

  // Extract keywords for intelligent search (supports German umlauts)
  const keywords = query.toLowerCase().match(/[a-zäöüß]{4,}/gi) || [];
  const searchTerms = keywords.filter(k =>
    !['what', 'when', 'where', 'which', 'latest', 'sind', 'über', 'neuesten', 'gibt', 'neues', 'oder'].includes(k)
  );

  // German to English medical device translations with compound splitting
  const translations: Record<string, string[]> = {
    'beinschrauben': ['screw', 'bone', 'orthopedic', 'leg'],
    'knieschrauben': ['screw', 'knee', 'orthopedic'],
    'hüftimplantat': ['implant', 'hip', 'orthopedic'],
    'knieimplantat': ['implant', 'knee', 'orthopedic'],
    'orthopädische': ['orthopedic', 'orthopaedic'],
    'implantate': ['implant'],
    'schrauben': ['screw'],
    'platte': ['plate'],
    'nagel': ['nail', 'rod'],
    'knochen': ['bone'],
  };

  // Expand search terms with translations + add single-word variants
  const expandedTerms: string[] = [...searchTerms];
  searchTerms.forEach(term => {
    if (translations[term]) {
      expandedTerms.push(...translations[term]);
    }
    // Always add single-word device keywords
    if (term.includes('schrauben')) expandedTerms.push('screw');
    if (term.includes('implantat')) expandedTerms.push('implant');
    if (term.includes('platte')) expandedTerms.push('plate');
    if (term.includes('nagel')) expandedTerms.push('nail', 'rod');
  });

  // Build search query with keyword matching (OR across all keywords)
  // Prioritize FDA 510(k), PMA, and patent sources for Bereich 3
  let allUpdates: any[] = [];
  if (expandedTerms.length > 0) {
    // Create OR conditions for each keyword (title OR description)
    const keywordConditions = expandedTerms.map(term =>
      or(
        ilike(regulatoryUpdates.title, `%${term}%`),
        ilike(regulatoryUpdates.description, `%${term}%`)
      )
    );

    // Combine all keyword conditions with OR
    const keywordFilter = or(...keywordConditions);

    // Device-specific sources (FDA, EMA, Health Canada)
    const deviceSources = ['fda_510k', 'fda_pma', 'health_canada_mdall', 'ema_epar'];

    // Try device-specific sources first
    allUpdates = await db
      .select({
        id: regulatoryUpdates.id,
        title: regulatoryUpdates.title,
        description: regulatoryUpdates.description,
        sourceId: regulatoryUpdates.sourceId,
        publishedDate: regulatoryUpdates.publishedDate,
      })
      .from(regulatoryUpdates)
      .where(and(
        keywordFilter,
        inArray(regulatoryUpdates.sourceId, deviceSources)
      ))
      .orderBy(sql`published_date DESC`)
      .limit(30);

    // Fallback to all sources if no device-specific results
    if (allUpdates.length === 0) {
      allUpdates = await db
        .select({
          id: regulatoryUpdates.id,
          title: regulatoryUpdates.title,
          description: regulatoryUpdates.description,
          sourceId: regulatoryUpdates.sourceId,
          publishedDate: regulatoryUpdates.publishedDate,
        })
        .from(regulatoryUpdates)
        .where(keywordFilter)
        .orderBy(sql`published_date DESC`)
        .limit(30);
    }
  }

  // Fallback to recent updates if no keyword matches
  if (allUpdates.length === 0) {
    allUpdates = await db
      .select({
        id: regulatoryUpdates.id,
        title: regulatoryUpdates.title,
        description: regulatoryUpdates.description,
        sourceId: regulatoryUpdates.sourceId,
        publishedDate: regulatoryUpdates.publishedDate,
      })
      .from(regulatoryUpdates)
      .orderBy(sql`published_date DESC`)
      .limit(15);
  }

  const systemPrompt = `You are a comprehensive regulatory intelligence assistant.
Provide clear, helpful information about medical device regulations across all regions.`;

  const prompt = `User query: "${query}"

Available regulatory updates (from all sources):
${allUpdates
  .map(
    (u: any) =>
      `- ${u.title} (${u.sourceId})\n  ${u.description?.substring(0, 100) || "No description"}`
  )
  .join("\n")}

Provide a helpful, comprehensive response.`;

  // Use Groq fallback if Anthropic not available
  if (!client) {
    logger.info("General Agent: Using Groq fallback");
    const analysis = await callGroqChatStreaming(prompt, systemPrompt);

    return {
      agent: "General",
      response: analysis,
      sources: allUpdates
        .map((u: any) => ({
          title: u.title,
          source: u.sourceId || "Unknown",
          date: u.publishedDate?.toISOString() || new Date().toISOString(),
          relevanceScore: 0.75,
        }))
        .slice(0, 3),
      metadata: {
        totalResultsFound: allUpdates.length,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  const response = await client!.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  const analysis =
    content.type === "text" ? content.text : "Unable to process query";

  return {
    agent: "General",
    response: analysis,
    sources: allUpdates
      .map((u: any) => ({
        title: u.title,
        source: u.sourceId || "Unknown",
        date: u.publishedDate?.toISOString() || new Date().toISOString(),
        relevanceScore: 0.75,
      }))
      .slice(0, 3),
    metadata: {
      totalResultsFound: allUpdates.length,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

/**
 * Main RAG pipeline with agent routing
 */
export async function processRegulatoryQuery(
  userQuery: string
): Promise<AgentResponse> {
  logger.info("Processing regulatory query", { query: userQuery });

  try {
    // Step 1: Route query to appropriate agent
    const routing = await routeQuery(userQuery);

    // Step 2: Execute appropriate agent
    let response: AgentResponse;

    switch (routing.agent) {
      case "fda":
        response = await fdaAgent(userQuery, routing.parameters);
        break;
      case "ema":
        response = await emaAgent(userQuery, routing.parameters);
        break;
      case "compliance":
        response = await complianceAgent(userQuery, routing.parameters);
        break;
      case "general":
      default:
        response = await generalAgent(userQuery, routing.parameters);
    }

    logger.info("Query processed successfully", {
      agent: routing.agent,
      sources: response.sources.length,
    });

    return response;
  } catch (error: any) {
    logger.error("Error processing regulatory query", {
      error: error.message,
      stack: error.stack
    });

    // Return fallback response on error
    return {
      agent: "General",
      response: `Entschuldigung, ich konnte Ihre Anfrage nicht vollständig verarbeiten.

Ihre Frage: "${userQuery}"

Bitte versuchen Sie es mit einer spezifischeren Frage zu regulatorischen Themen wie FDA-Zulassungen, EMA-Freigaben oder Compliance-Anforderungen.

Technischer Hinweis: ${error.message}`,
      sources: [],
      metadata: {
        totalResultsFound: 0,
        processingTimeMs: 0,
      },
    };
  }
}

export { routeQuery };
