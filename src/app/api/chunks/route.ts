import { dividirEmChunks } from "@/lib/documents/chunk";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const texto: string = body.texto;

    if (!texto) {
      return Response.json(
        {
          erro: "Nenhum texto foi enviado.",
        },
        { status: 400 }
      );
    }

    const chunks = dividirEmChunks(texto);

    return Response.json({
      quantidade: chunks.length,
      chunks,
    });
  } catch (error) {
    console.error("Erro ao dividir texto:", error);

    return Response.json(
      {
        erro: "Não foi possível dividir o texto.",
      },
      { status: 500 }
    );
  }
}