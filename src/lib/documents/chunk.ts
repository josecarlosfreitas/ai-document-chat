export function dividirEmChunks(
  texto: string,
  tamanho: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];

  let inicio = 0;

  while (inicio < texto.length) {
    const fim = inicio + tamanho;

    const chunk = texto.slice(inicio, fim).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    inicio += tamanho - overlap;
  }

  return chunks;
}