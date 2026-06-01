export type Embedder = (texts: string[]) => Promise<number[][]>

export const openAIEmbedder =
  (apiKey: string, model = 'text-embedding-3-small'): Embedder =>
  async texts => {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: texts }),
    })
    if (!res.ok) throw new Error(`embeddings failed: ${res.status}`)
    const json = (await res.json()) as { data: { embedding: number[] }[] }
    return json.data.map(d => d.embedding)
  }
