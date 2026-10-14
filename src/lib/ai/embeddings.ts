import { ai } from "./gemini";

export async function gerarEmbedding(texto: string) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: texto,
  });

  return response.embeddings?.[0]?.values ?? [];
}

export async function gerarEmbeddings(chunks: string[]) {
  const embeddings: number[][] = [];

  for (const chunk of chunks) {
    const embedding = await gerarEmbedding(chunk);

    embeddings.push(embedding);
  }

  return embeddings;
}