/**
 * Telemetry bootstrap: wires up a {@link NodeTracerProvider} with a single span
 * exporter and registers it as the global tracer provider.
 *
 * Exporter selection:
 *   - `'console'` (default) — pretty-prints finished spans to stdout.
 *   - `'otlp'` — ships spans over OTLP/HTTP to a collector. Auto-selected when
 *     the `OTEL_EXPORTER_OTLP_ENDPOINT` env var is set.
 *   - `'memory'` — keeps finished spans in process for assertions in tests.
 *
 * Uses `resourceFromAttributes` (the non-deprecated resource factory in
 * `@opentelemetry/resources` v2; the old `new Resource(...)` constructor is
 * deprecated) and the `BatchSpanProcessor`/`SimpleSpanProcessor` pairing
 * appropriate to each exporter.
 */

import { trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  InMemorySpanExporter,
  type ReadableSpan,
  SimpleSpanProcessor,
  type SpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { INSTRUMENTATION_VERSION } from './tracer.js';

/** Which exporter the SDK should send finished spans to. */
export type ExporterKind = 'console' | 'otlp' | 'memory';

/** Options for {@link setupTelemetry}. */
export interface TelemetryOptions {
  /** `service.name` resource attribute. Defaults to `OTEL_SERVICE_NAME` env or a fixed name. */
  serviceName?: string;
  /**
   * Exporter to use. Defaults to `'console'`, but auto-upgrades to `'otlp'`
   * when `OTEL_EXPORTER_OTLP_ENDPOINT` is set and no explicit value is passed.
   */
  exporter?: ExporterKind;
}

/** Handle returned by {@link setupTelemetry} for lifecycle + (in memory mode) inspection. */
export interface TelemetryHandle {
  /** The exporter kind that was actually selected. */
  readonly exporter: ExporterKind;
  /** The resolved `service.name`. */
  readonly serviceName: string;
  /** Flushes and shuts down the provider. Call once at the end of a program/test. */
  shutdown(): Promise<void>;
  /**
   * Returns the spans captured so far. Only meaningful for `exporter: 'memory'`;
   * for other exporters it returns an empty array.
   */
  getFinishedSpans(): ReadableSpan[];
}

const DEFAULT_SERVICE_NAME = 'otel-mcp-agent';

/**
 * Resolves the exporter kind: an explicit option wins; otherwise we pick
 * `'otlp'` when `OTEL_EXPORTER_OTLP_ENDPOINT` is present, else `'console'`.
 */
function resolveExporter(explicit: ExporterKind | undefined): ExporterKind {
  if (explicit) return explicit;
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return 'otlp';
  return 'console';
}

/**
 * Boots OpenTelemetry tracing for the process and registers it globally.
 *
 * @returns a {@link TelemetryHandle}; always call `shutdown()` when done so
 * batched spans are flushed.
 */
export function setupTelemetry(options: TelemetryOptions = {}): TelemetryHandle {
  const serviceName =
    options.serviceName ?? process.env.OTEL_SERVICE_NAME ?? DEFAULT_SERVICE_NAME;
  const exporterKind = resolveExporter(options.exporter);

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: INSTRUMENTATION_VERSION,
  });

  // The memory exporter is held so the handle can expose its captured spans.
  const memoryExporter =
    exporterKind === 'memory' ? new InMemorySpanExporter() : undefined;

  let spanExporter: SpanExporter;
  switch (exporterKind) {
    case 'otlp':
      spanExporter = new OTLPTraceExporter();
      break;
    case 'memory':
      // memoryExporter is defined on this branch by construction.
      spanExporter = memoryExporter as InMemorySpanExporter;
      break;
    case 'console':
    default:
      spanExporter = new ConsoleSpanExporter();
      break;
  }

  // Console/memory want synchronous, ordered export so output and assertions are
  // deterministic; OTLP batches for network efficiency.
  const spanProcessor =
    exporterKind === 'otlp'
      ? new BatchSpanProcessor(spanExporter)
      : new SimpleSpanProcessor(spanExporter);

  const provider = new NodeTracerProvider({
    resource,
    spanProcessors: [spanProcessor],
  });

  // The global trace API ignores a second `setGlobalTracerProvider` once one is
  // set, so clear any previously registered provider first. This makes repeated
  // `setupTelemetry()` calls (e.g. one per test) each install their own
  // provider + in-memory exporter instead of silently sharing the first one.
  trace.disable();

  // Register as the global provider so `trace.getTracer(...)` in tracer.ts
  // resolves to this provider with no manual context plumbing.
  provider.register();

  return {
    exporter: exporterKind,
    serviceName,
    async shutdown(): Promise<void> {
      await provider.shutdown();
    },
    getFinishedSpans(): ReadableSpan[] {
      return memoryExporter ? memoryExporter.getFinishedSpans() : [];
    },
  };
}
