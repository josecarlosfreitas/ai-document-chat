import { ai } from "@/lib/ai/gemini";

export async function GET() {
  try {
    const texto = "Quantos dias de férias o funcionário tem?";

    const response = await ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: texto,
    });

    return Response.json({
      texto,
      embedding: response.embeddings?.[0]?.values,
    });
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);

    return Response.json(
      {
        erro: "Não foi possível gerar o embedding.",
      },
      { status: 500 }
    );
  }
}