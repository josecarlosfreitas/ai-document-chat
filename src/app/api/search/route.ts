
import { supabase } from "@/lib/supabase/server";
import { gerarEmbedding } from "@/lib/ai/embeddings";

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

    const embedding = await gerarEmbedding(pergunta);

    if (embedding.length !== 3072) {
      return Response.json(
        { erro: "O embedding da pergunta possui dimensão inválida." },
        { status: 500 }
      );
    }

    const { data, error } = await supabase.rpc(
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

    return Response.json({
      pergunta,
      resultados: data ?? [],
    });
  } catch (error) {
    console.error("Erro na API de busca:", error);

    return Response.json(
      { erro: "Não foi possível processar a pergunta." },
      { status: 500 }
    );
  }
}
