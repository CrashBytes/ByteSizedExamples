import Anthropic from "@anthropic-ai/sdk";
import {
  buildGroundedPrompt,
  filterCitations,
  type Citation,
  type ScoredChunk,
  type Synthesizer,
} from "@cb/rag-core";

export interface ClaudeSynthesizerOptions {
  apiKey: string;
  /** Defaults to claude-opus-4-8 — the most capable Opus-tier model. */
  model?: string;
  maxTokens?: number;
}

/**
 * The "cloud quality" synthesizer. Lives in the server (not rag-core) so the
 * Anthropic SDK never has to ship inside the React Native bundle.
 *
 * Two production details worth calling out:
 *
 *  - **Adaptive thinking** (`thinking: { type: "adaptive" }`) lets Opus 4.8
 *    decide how much to reason per question. RAG synthesis is mostly reading +
 *    grounding, so it usually thinks little, but a multi-passage reconciliation
 *    question gets the extra reasoning for free.
 *  - **Streaming.** We stream and then await `finalMessage()`. Even though we
 *    only return the final string here, streaming is the timeout-safe way to
 *    call the API; swap in token-by-token forwarding (SSE) when you want the
 *    answer to render as it generates in the app.
 *
 * The grounding prompt and citation contract come from rag-core's pure
 * `buildGroundedPrompt`, so they are identical to anything else that synthesizes
 * and are unit-tested without the network.
 */
export class ClaudeSynthesizer implements Synthesizer {
  readonly name: string;
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(opts: ClaudeSynthesizerOptions) {
    this.client = new Anthropic({ apiKey: opts.apiKey });
    this.model = opts.model ?? "claude-opus-4-8";
    this.maxTokens = opts.maxTokens ?? 1024;
    this.name = `claude:${this.model}`;
  }

  async synthesize(query: string, contexts: ScoredChunk[]): Promise<{ answer: string; citations: Citation[] }> {
    if (contexts.length === 0) {
      return {
        answer: "I couldn't find anything relevant to that in the indexed content.",
        citations: [],
      };
    }

    const { system, user, citations } = buildGroundedPrompt(query, contexts);

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: this.maxTokens,
      // Adaptive thinking is the correct setting for Opus 4.7/4.8 — `budget_tokens`
      // ("enabled") returns a 400 on these models. The published SDK types still
      // only enumerate "enabled" | "disabled", so we assert the runtime-valid
      // shape against the SDK's own param type until the types catch up.
      thinking: { type: "adaptive" } as unknown as Anthropic.MessageStreamParams["thinking"],
      system,
      messages: [{ role: "user", content: user }],
    });

    const message = await stream.finalMessage();
    const answer = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    // Trim the source list to the passages Claude actually cited.
    return { answer, citations: filterCitations(answer, citations) };
  }
}
