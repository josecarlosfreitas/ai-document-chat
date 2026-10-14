import { extractText } from "unpdf";
import { dividirEmChunks } from "@/lib/documents/chunk";
import { gerarEmbeddings } from "@/lib/ai/embeddings";
import { supabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let documentId: string | null = null;

  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivo");

    if (!(arquivo instanceof File)) {
      return Response.json(
        { erro: "Nenhum arquivo PDF foi enviado." },
        { status: 400 }
      );
    }

    if (
      arquivo.type !== "application/pdf" &&
      !arquivo.name.toLowerCase().endsWith(".pdf")
    ) {
      return Response.json(
        { erro: "O arquivo enviado precisa ser um PDF." },
        { status: 400 }
      );
    }

    const buffer = await arquivo.arrayBuffer();
    const { text } = await extractText(new Uint8Array(buffer));
    const texto = text.join("\n");
    const chunks = dividirEmChunks(texto);

    if (chunks.length === 0) {
      return Response.json(
        { erro: "Não foi possível criar chunks a partir do PDF." },
        { status: 400 }
      );
    }

    const embeddings = await gerarEmbeddings(chunks);

    if (
      embeddings.length !== chunks.length ||
      embeddings.some((embedding) => embedding.length !== 3072)
    ) {
      return Response.json(
        { erro: "Os embeddings gerados possuem dimensões inválidas." },
        { status: 500 }
      );
    }

    // 1. Salva os metadados do documento.
    const { data: documento, error: erroDocumento } = await supabase
      .from("documents")
      .insert({ nome: arquivo.name })
      .select("id, nome, created_at")
      .single();

    if (erroDocumento) {
      console.error("Erro ao salvar documento:", erroDocumento);
      return Response.json(
        { erro: "Não foi possível salvar o documento no Supabase." },
        { status: 500 }
      );
    }

    documentId = documento.id;

    // 2. Prepara os chunks com seus respectivos embeddings.
    const registros = chunks.map((content, index) => ({
      document_id: documento.id,
      content,
      embedding: JSON.stringify(embeddings[index]),
    }));

    // 3. Salva todos os chunks.
    const { error: erroChunks } = await supabase
      .from("document_chunks")
      .insert(registros);

    if (erroChunks) {
      console.error("Erro ao salvar chunks:", erroChunks);

      // Remove o documento para não deixar dados incompletos.
      const { error: erroRollback } = await supabase
        .from("documents")
        .delete()
        .eq("id", documento.id);

      if (erroRollback) {
        console.error(
          "Erro ao remover documento após falha:",
          erroRollback
        );
      }

      documentId = null;

      return Response.json(
        { erro: "Não foi possível salvar os chunks no Supabase." },
        { status: 500 }
      );
    }

    return Response.json({
      sucesso: true,
      documentId: documento.id,
      nome: documento.nome,
      texto,
      quantidadeChunks: chunks.length,
      chunks,
      embeddings,
    });
  } catch (error) {
    console.error("Erro ao processar PDF:", error);

    // Tenta limpar o documento caso ocorra uma falha inesperada.
    if (documentId) {
      const { error: erroRollback } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (erroRollback) {
        console.error("Erro ao limpar documento:", erroRollback);
      }
    }

    return Response.json(
      { erro: "Não foi possível processar o PDF." },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, nome, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao listar documentos:", error);

      return Response.json(
        { erro: "Não foi possível listar os documentos." },
        { status: 500 }
      );
    }

    return Response.json({ documentos: data ?? [] });
  } catch (error) {
    console.error("Erro na API de documentos:", error);

    return Response.json(
      { erro: "Não foi possível buscar os documentos." },
      { status: 500 }
    );
  }
}

