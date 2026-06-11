import type { RagAnswer } from "@cb/rag-core";

/**
 * Cloud retrieval client. Talks to the retrieval server, which runs the same
 * pipeline with Voyage embeddings and Claude synthesis. The phone never holds
 * an API key — the server does — which is the correct trust boundary: secrets
 * stay server-side, the device sends a question and renders a cited answer.
 */
const BASE_URL = process.env.EXPO_PUBLIC_RAG_API_URL ?? "http://localhost:8787";

export async function remoteAnswer(query: string, signal?: AbortSignal): Promise<RagAnswer> {
  const res = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, k: 4, alpha: 0.7 }),
    ...(signal ? { signal } : {}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Retrieval server returned ${res.status}. ${detail}`.trim());
  }

  return (await res.json()) as RagAnswer;
}

export function remoteBaseUrl(): string {
  return BASE_URL;
}
