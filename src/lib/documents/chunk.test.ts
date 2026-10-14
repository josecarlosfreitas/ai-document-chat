import { dividirEmChunks } from "./chunk";

const texto = `
A inteligência artificial é uma área da computação.

Os modelos de linguagem conseguem analisar textos
e gerar respostas baseadas nos dados recebidos.

RAG permite que uma aplicação busque informações
em documentos antes de gerar uma resposta.
`;

const chunks = dividirEmChunks(texto, 100, 20);

console.log("Quantidade de chunks:", chunks.length);

chunks.forEach((chunk, index) => {
  console.log(`\n--- Chunk ${index + 1} ---`);
  console.log(chunk);
});