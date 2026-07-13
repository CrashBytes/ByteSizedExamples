/**
 * Runnable demo.
 *
 * Two modes:
 *
 *  1. ONLINE (ANTHROPIC_API_KEY set): construct a real Anthropic client and run
 *     `CachingClient.ask` twice against the SAME large stable context with two
 *     different questions. The first call writes the cache; the second reads it.
 *     We print the plan warnings and the savings report each time so you can
 *     watch the cache write turn into a cache read.
 *
 *  2. OFFLINE (no key): run the planner, the invalidator audit, and a SIMULATED
 *     savings calc on a hand-made `UsageLike`, so `npm start` still demonstrates
 *     the full output shape with no network access.
 *
 * The stable context below is a ~3,000-word fake "knowledge base" — big enough
 * to clear the Opus 4.8 minimum cacheable prefix (4,096 tokens) so caching
 * actually engages.
 */

import { CachingClient } from "./client.js";
import { planRequest } from "./cache-planner.js";
import { auditForInvalidators, auditTools } from "./invalidator-audit.js";
import { computeSavings } from "./savings.js";
import type { ToolDef, UsageLike } from "./types.js";

/** A stable tool set — deterministic, safe to cache. */
const TOOLS: ToolDef[] = [
  {
    name: "search_docs",
    description: "Search the internal documentation index for a query string.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

const SYSTEM_PROMPT =
  "You are Atlas, a support engineer for the Meridian data platform. " +
  "Answer strictly from the provided knowledge base. Cite the section you " +
  "used. If the answer is not in the knowledge base, say so plainly. Do not " +
  "invent configuration flags, API endpoints, or version numbers.";

/**
 * Build the ~3,000-word knowledge base. Composed from a set of stable
 * paragraphs so the whole string is deterministic (no dates, no IDs) and long
 * enough to cache. Nothing here changes between requests — that is the point.
 */
function buildKnowledgeBase(): string {
  const sections = [
    `# Meridian Data Platform — Operations Handbook`,
    `## Ingestion. Meridian ingests events through the Gateway service, which accepts newline-delimited JSON over HTTPS and Kafka topics prefixed with "meridian.". Every event must carry a "tenant" field and a monotonically increasing "seq" field scoped to that tenant. The Gateway validates the envelope, applies the tenant's schema contract, and forwards accepted events to the durable log. Rejected events are written to the dead-letter topic "meridian.dlq" with a rejection code. Operators should watch the dlq_rate metric; a sustained rate above two percent usually indicates a schema drift between a producer and the registered contract. The Gateway is horizontally scalable and stateless; capacity is governed by the ingest_partitions setting, which defaults to sixteen and can be raised without downtime by rolling the Gateway deployment.`,
    `## The durable log. Accepted events land in the durable log, an append-only store partitioned by tenant and time. Each partition is replicated three ways across availability zones. Reads are served from the nearest in-zone replica. Retention is controlled per tenant by the retention_days contract field; the platform default is thirty days, and compliance tenants commonly set it to three hundred and sixty-five. Compaction runs hourly and collapses superseded records identified by the "key" and "seq" pair, keeping only the highest seq for a given key. Because compaction is key-scoped, producers that reuse keys across unrelated records will see unexpected data loss; the guidance is to namespace keys by record type.`,
    `## Query layer. The Query layer exposes a SQL-like dialect called MeridianQL. Queries are planned by the Coordinator and executed by a pool of Worker nodes. The Coordinator caches query plans keyed by the normalized query text and the schema version; a plan cache hit skips planning entirely. Workers stream partial aggregates back to the Coordinator, which performs the final merge. Long-running queries can be given a budget with the WITH BUDGET clause, after which the engine returns a partial result flagged as incomplete rather than consuming unbounded resources. The most common performance mistake is selecting high-cardinality columns without a time bound; always constrain queries with a time range that matches the partition layout.`,
    `## Access control. Meridian uses attribute-based access control. Every principal carries a set of attributes, and every dataset carries a policy expression evaluated against those attributes at query time. Policies are pure and deterministic: the same principal and dataset always evaluate identically, which is what allows the Coordinator to cache authorization decisions for the duration of a query. Administrators manage policies through the Control API; changes take effect within one refresh interval, which defaults to sixty seconds. There is no per-row encryption at the storage layer; sensitive columns should be tokenized by the producer before ingestion, and Meridian stores only the tokens.`,
    `## Backups and recovery. Snapshots of the durable log are taken every six hours and shipped to object storage in a separate account. A snapshot is a consistent cut across all partitions for a tenant. Point-in-time recovery replays the write-ahead segments from the nearest snapshot forward to the requested timestamp. Recovery is a tenant-scoped operation and does not interrupt other tenants. The recovery runbook requires two operators to approve a restore into a production namespace; restores into a scratch namespace require only one. After any restore, run the integrity_scan job, which recomputes partition checksums and compares them against the snapshot manifest.`,
    `## Metrics and alerting. Meridian emits operational metrics on the "meridian.internal.metrics" topic and mirrors them to the observability stack. The signals that matter most are ingest_lag, which measures the delay between event arrival and durable commit; dlq_rate, described above; query_p99, the ninety-ninth percentile query latency; and replica_health, a per-partition gauge. Alerts should be defined on trends, not instantaneous spikes: a single ingest_lag spike during a compaction cycle is normal, but a rising ingest_lag over ten minutes indicates the durable log is falling behind and the ingest_partitions setting may need to be raised.`,
    `## Upgrades. Platform upgrades are rolled zone by zone. The Coordinator and Workers are version-compatible within one minor version, so a mixed-version pool is safe during a rollout but should not be left in that state longer than a day. Schema contracts are versioned independently of the platform; a contract change is additive-only by policy, meaning fields may be added but never removed or retyped, which guarantees that older consumers keep working. Breaking changes are handled by registering a new contract under a new name and migrating producers and consumers across at their own pace.`,
    `## Cost controls. Compute cost is dominated by the Worker pool and by cross-zone read traffic. Keeping reads in-zone is the largest lever; the second is query hygiene, since unbounded scans read far more partitions than necessary. Storage cost is driven by retention_days and by producers that fail to namespace keys, which defeats compaction and leaves superseded records on disk. Each tenant has a monthly budget; when a tenant crosses ninety percent of its budget the platform emits a budget_warning event, and at one hundred percent it throttles new ingestion for that tenant while continuing to serve reads.`,
    `## Troubleshooting. If ingestion stalls for one tenant but not others, suspect a schema drift and inspect meridian.dlq for that tenant. If queries are slow across all tenants, check query_p99 and replica_health before touching the Worker pool, since a single unhealthy replica can drag the p99 for everyone. If a restore fails integrity_scan, do not promote the namespace; instead re-run the restore from the previous snapshot and open an incident. If authorization decisions seem stale after a policy change, confirm the refresh interval has elapsed; the Coordinator will not re-evaluate cached decisions mid-query by design.`,
    `## Appendix A: settings reference. ingest_partitions controls Gateway parallelism and defaults to sixteen. retention_days controls durable-log retention per tenant and defaults to thirty. refresh_interval controls how quickly policy changes take effect and defaults to sixty seconds. snapshot_interval is fixed at six hours and is not tenant-configurable. compaction_interval is fixed at one hour. All intervals are expressed in the tenant contract using ISO-8601 duration syntax, and the platform rejects contracts that set a value below the documented minimum for that field.`,
    `## Appendix B: glossary. A tenant is an isolated customer namespace. A partition is the unit of replication and retention. A contract is the registered schema and settings for a tenant. The Coordinator plans and merges queries; Workers execute them. The dead-letter topic holds rejected events. Compaction collapses superseded records by key and seq. A snapshot is a consistent cut of the durable log. Point-in-time recovery replays write-ahead segments forward from a snapshot. Attribute-based access control evaluates dataset policies against principal attributes at query time.`,
  ];
  // Repeat the operational sections under two extra headings so the knowledge
  // base comfortably exceeds 3,000 words AND clears the Opus 4.8 minimum
  // cacheable prefix (4,096 tokens), all while staying byte-deterministic.
  const runbooks = [
    `# Runbooks (expanded)`,
    ...sections.slice(1).map((s) => s.replace(/^## /, "### Runbook — ")),
  ];
  const escalations = [
    `# Escalation procedures`,
    ...sections.slice(1).map((s) => s.replace(/^## /, "### Escalation — ")),
  ];
  return [...sections, ...runbooks, ...escalations].join("\n\n");
}

const KNOWLEDGE_BASE = buildKnowledgeBase();

/** Pretty-print a USD amount with enough precision for small per-request costs. */
function usd(n: number): string {
  return `$${n.toFixed(6)}`;
}

function printSavings(label: string, report: ReturnType<typeof computeSavings>) {
  console.log(`\n[${label}] savings report`);
  console.log(`  model:            ${report.model}`);
  console.log(`  cache hit rate:   ${(report.cacheHitRate * 100).toFixed(1)}%`);
  console.log(`  actual input:     ${usd(report.actualInputCostUsd)}`);
  console.log(`  uncached input:   ${usd(report.uncachedInputCostUsd)}`);
  console.log(`  saved:            ${usd(report.savedUsd)}`);
  console.log(`  saved percent:    ${(report.savedPct * 100).toFixed(1)}%`);
}

async function runOnline(apiKey: string): Promise<void> {
  console.log("ANTHROPIC_API_KEY detected — running against the live API.\n");
  // Imported lazily so the offline path never needs the SDK loaded.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey });
  const client = new CachingClient({
    anthropic: anthropic as unknown as ConstructorParameters<
      typeof CachingClient
    >[0]["anthropic"],
    model: "claude-opus-4-8",
    maxTokens: 512,
  });

  const questions = [
    "How is retention configured per tenant, and what is the default?",
    "What should I check first if queries are slow across all tenants?",
  ];

  for (let i = 0; i < questions.length; i++) {
    const label = i === 0 ? "request 1 (cache write)" : "request 2 (cache read)";
    const { plan, savings, response } = await client.ask({
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      context: KNOWLEDGE_BASE,
      question: questions[i],
      ttl: "5m",
    });
    console.log(`\n=== ${label} ===`);
    console.log(`estimated stable prefix: ~${plan.estimatedStablePrefixTokens} tokens`);
    if (plan.warnings.length) {
      console.log("warnings:");
      for (const w of plan.warnings) console.log(`  - ${w}`);
    }
    console.log("usage:", response.usage);
    printSavings(label, savings);
  }
}

function runOffline(): void {
  console.log(
    "No ANTHROPIC_API_KEY set — running the planner, audit, and a SIMULATED\n" +
      "savings calc offline. Set ANTHROPIC_API_KEY to exercise the live API.\n",
  );

  // 1. Plan a request and show where the breakpoint landed.
  const plan = planRequest({
    model: "claude-opus-4-8",
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    context: KNOWLEDGE_BASE,
    question: "How is retention configured per tenant, and what is the default?",
    ttl: "5m",
  });
  console.log("=== cache plan ===");
  console.log(`model:                    ${plan.model}`);
  console.log(`estimated stable prefix:  ~${plan.estimatedStablePrefixTokens} tokens`);
  console.log(`breakpoints:              ${plan.breakpoints}`);
  const lastSystem = plan.system[plan.system.length - 1];
  console.log(
    `breakpoint on last system block: ${JSON.stringify(lastSystem.cache_control)}`,
  );
  console.log(
    `question block cache_control:    ${JSON.stringify(
      plan.messages[0].content[0].cache_control,
    )} (should be undefined)`,
  );
  console.log(`warnings: ${plan.warnings.length ? plan.warnings.join("; ") : "none"}`);

  // 2. Audit a deliberately-poisoned prompt to show the invalidator scan.
  console.log("\n=== invalidator audit (deliberately bad prompt) ===");
  const badPrompt =
    "You are a helper. Session started at 2026-07-13T09:00:00Z for user " +
    "3f2504e0-4f89-41d3-9a0c-0305e82c3301. Nonce: Math.random().";
  const findings = auditForInvalidators(badPrompt);
  for (const f of findings) {
    console.log(`  [${f.rule}] "${f.match}" @${f.index} — ${f.hint}`);
  }
  const toolAudit = auditTools(TOOLS);
  console.log(
    `  tool set: ${toolAudit.findings.length} findings; canonical form is ${toolAudit.canonical.length} chars`,
  );

  // 3. Simulate savings for the two-request pattern (write then read) using a
  //    hand-made usage that mirrors what the API would return.
  const prefix = plan.estimatedStablePrefixTokens;
  const writeUsage: UsageLike = {
    input_tokens: 40, // just the volatile question
    cache_creation_input_tokens: prefix,
    cache_read_input_tokens: 0,
    output_tokens: 120,
  };
  const readUsage: UsageLike = {
    input_tokens: 40,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: prefix,
    output_tokens: 120,
  };
  printSavings(
    "request 1 (cache write, simulated)",
    computeSavings("claude-opus-4-8", writeUsage, "5m"),
  );
  printSavings(
    "request 2 (cache read, simulated)",
    computeSavings("claude-opus-4-8", readUsage, "5m"),
  );
}

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    await runOnline(apiKey);
  } else {
    runOffline();
  }
}

main().catch((err) => {
  console.error("Demo failed:", err);
  process.exitCode = 1;
});
