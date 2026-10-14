import { supabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, nome")
      .limit(5);

    if (error) {
      console.error("Erro no Supabase:", error);

      return Response.json(
        {
          erro: error.message,
        },
        { status: 500 }
      );
    }

    return Response.json({
      sucesso: true,
      documentos: data,
    });
  } catch (error) {
    console.error("Erro:", error);

    return Response.json(
      {
        erro: "Não foi possível conectar ao Supabase.",
      },
      { status: 500 }
    );
  }
}