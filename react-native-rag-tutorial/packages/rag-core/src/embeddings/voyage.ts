import type { EmbeddingProvider } from "../types.js";
import { normalize } from "../math.js";

export interface VoyageOptions {
  apiKey: string;
  /** Voyage model id. `voyage-3.5` is a strong general-purpose default. */
  model?: string;
  /** Output dimension. Voyage 3.x supports Matryoshka dims (256/512/1024/2048). */
  dimensions?: number;
  /** Override for testing. */
  baseUrl?: string;
  /** `query` vs `document` — Voyage embeds the two asymmetrically for better recall. */
  inputType?: "query" | "document";
}

/**
 * Production embedder backed by Voyage AI.
 *
 * Anthropic does not ship a first-party embeddings endpoint and recommends
 * Voyage for retrieval; this provider is the "cloud quality" half of the
 * on-device/server tradeoff the tutorial is about. It implements the same
 * `EmbeddingProvider` interface as the hashing embedder, so the pipeline cannot
 * tell them apart.
 *
 * Note the `inputType` asymmetry: passing `input_type: "query"` for the user's
 * question and `"document"` for stored chunks measurably improves retrieval,
 * because the model projects questions and answers into compatible regions of
 * the space. `RagPipeline` sets this automatically on each side.
 */
export class VoyageEmbeddingProvider implements EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly inputType: "query" | "document";

  constructor(opts: VoyageOptions) {
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? "voyage-3.5";
    this.dimensions = opts.dimensions ?? 1024;
    this.baseUrl = opts.baseUrl ?? "https://api.voyageai.com/v1";
    this.inputType = opts.inputType ?? "document";
    this.name = `voyage:${this.model}`;
  }

  /** Return a copy of this provider configured for the query side. */
  forQueries(): VoyageEmbeddingProvider {
    return new VoyageEmbeddingProvider({
      apiKey: this.apiKey,
      model: this.model,
      dimensions: this.dimensions,
      baseUrl: this.baseUrl,
      inputType: "query",
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
        input_type: this.inputType,
        output_dimension: this.dimensions,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Voyage embeddings failed: ${res.status} ${res.statusText} ${detail}`);
    }

    const json = (await res.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
    };

    // Voyage returns results in request order, but sort defensively by index.
    return json.data
      .sort((a, b) => a.index - b.index)
      .map((d) => normalize(d.embedding));
  }
}
