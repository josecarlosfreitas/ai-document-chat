
import { ai } from "@/lib/ai/gemini";
import { gerarEmbedding } from "@/lib/ai/embeddings";
import { supabase } from "@/lib/supabase/server";


async function gerarRespostaComRetry(prompt: string) {
  const tentativasMaximas = 3;

  for (let tentativa = 1; tentativa <= tentativasMaximas; tentativa++) {
    try {
      return await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
      });
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : String(error);

      const erroTemporario =
        mensagem.includes("503") ||
        mensagem.includes("UNAVAILABLE");

      if (!erroTemporario || tentativa === tentativasMaximas) {
        throw error;
      }

      const espera = tentativa * 2000;

      console.warn(
        `Gemini indisponível. Nova tentativa em ${espera / 1000}s.`
      );

      await new Promise((resolve) => setTimeout(resolve, espera));
    }
  }

  throw new Error("Não foi possível gerar a resposta após as tentativas.");
}


export async function POST(request: Request) {
  try {
    const body = await request.json();

    const pergunta =
      typeof body.pergunta === "string" ? body.pergunta.trim() : "";

    const documentId =
      typeof body.documentId === "string" ? body.documentId : null;

    if (!pergunta) {
      return Response.json(
        { erro: "Informe uma pergunta." },
        { status: 400 }
      );
    }

    // 1. Converte a pergunta em embedding.
    const embedding = await gerarEmbedding(pergunta);

    if (embedding.length !== 3072) {
      return Response.json(
        { erro: "O embedding da pergunta possui dimensão inválida." },
        { status: 500 }
      );
    }

    // 2. Busca os trechos mais relevantes no Supabase.
    const { data: chunks, error } = await supabase.rpc(
      "match_document_chunks",
      {
        query_embedding: JSON.stringify(embedding),
        match_count: 5,
        filter_document_id: documentId,
      }
    );

    if (error) {
      console.error("Erro na busca semântica:", error);

      return Response.json(
        { erro: "Não foi possível pesquisar os documentos." },
        { status: 500 }
      );
    }

    if (!chunks || chunks.length === 0) {
      return Response.json({
        pergunta,
        resposta: "Não encontrei informações relevantes nos documentos.",
        fontes: [],
      });
    }

    // 3. Prepara o contexto recuperado para o Gemini.
    const contexto = chunks
      .map(
        (chunk: { content: string }, index: number) =>
          `[Trecho ${index + 1}]\n${chunk.content}`
      )
      .join("\n\n");

    // 4. Gera uma resposta baseada no contexto.
    const response = await gerarRespostaComRetry(`
Você é um assistente que responde perguntas com base em documentos.

Regras:
- Use somente as informações presentes nos trechos fornecidos.
- Não invente fatos nem complete lacunas com conhecimento externo.
- Se os trechos não contiverem a resposta, informe que não encontrou essa informação nos documentos.
- Responda em português brasileiro.
- Seja claro e direto.

Trechos recuperados:
${contexto}

Pergunta do usuário:
${pergunta}
`,
    );

    const resposta =
      response.text?.trim() ||
      "Não foi possível gerar uma resposta.";

    return Response.json({
      pergunta,
      resposta,
      fontes: chunks.map(
        (chunk: {
          id: string;
          content: string;
          similarity: number;
        }) => ({
          id: chunk.id,
          trecho: chunk.content,
          similaridade: chunk.similarity,
        })
      ),
    });
  } catch (error) {
    console.error("Erro na API de chat:", error);

    return Response.json(
      { erro: "Não foi possível responder à pergunta." },
      { status: 500 }
    );
  }
}
