
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Mensagem = {
  id: number;
  papel: "user" | "assistant";
  conteudo: string;
  fontes?: {
    id: string;
    trecho: string;
    similaridade: number;
  }[];
};

type Documento = {
  id: string;
  nome: string;
  created_at: string;
};

export default function Home() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [chunks, setChunks] = useState<string[]>([]);
  const [quantidadeChunks, setQuantidadeChunks] = useState(0);
  const [embeddings, setEmbeddings] = useState<number[][]>([]);
  const [carregandoArquivo, setCarregandoArquivo] = useState(false);
  const [erroArquivo, setErroArquivo] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregandoResposta, setCarregandoResposta] = useState(false);
  const [erroChat, setErroChat] = useState("");
  const fimMensagensRef = useRef<HTMLDivElement>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregandoDocumentos, setCarregandoDocumentos] = useState(true);
  const [erroDocumentos, setErroDocumentos] = useState("");

  async function carregarDocumentos() {
    setCarregandoDocumentos(true);
    setErroDocumentos("");

    try {
      const response = await fetch("/api/documents");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro || "Não foi possível carregar os documentos."
        );
      }

      const lista: Documento[] = data.documentos ?? [];

      setDocumentos(lista);

      const documentoSalvo = localStorage.getItem(
        "ai-document-chat:selectedDocumentId"
      );

      if (
        documentoSalvo &&
        lista.some((documento) => documento.id === documentoSalvo)
      ) {
        setDocumentId(documentoSalvo);
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);

      setErroDocumentos(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os documentos."
      );
    } finally {
      setCarregandoDocumentos(false);
    }
  }

  useEffect(() => {
    carregarDocumentos();
  }, []);

  useEffect(() => {
    if (!documentId) return;

    localStorage.setItem(
      "ai-document-chat:selectedDocumentId",
      documentId
    );
  }, [documentId]);

  async function enviarArquivo() {
    if (!arquivo) {
      setErroArquivo("Selecione um arquivo PDF.");
      return;
    }

    setCarregandoArquivo(true);
    setErroArquivo("");
    setChunks([]);
    setEmbeddings([]);

    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setErroArquivo(data.erro || "Erro ao processar o PDF.");
        return;
      }

      localStorage.setItem(
        "ai-document-chat:selectedDocumentId",
        data.documentId
      );

      setQuantidadeChunks(data.quantidadeChunks);
      setChunks(data.chunks);
      setEmbeddings(data.embeddings);
      setDocumentId(data.documentId);
      setMensagens([]);
      setErroChat("");

      await carregarDocumentos();
    } catch (error) {
      console.error(error);
      setErroArquivo("Não foi possível enviar o PDF.");
    } finally {
      setCarregandoArquivo(false);
    }
  }

  async function enviarPergunta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const textoPergunta = pergunta.trim();

    if (!textoPergunta || carregandoResposta) return;

    const mensagemUsuario: Mensagem = {
      id: Date.now(),
      papel: "user",
      conteudo: textoPergunta,
    };

    setMensagens((anteriores) => [...anteriores, mensagemUsuario]);
    setPergunta("");
    setCarregandoResposta(true);
    setErroChat("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pergunta: textoPergunta,
          documentId: documentId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || "Não foi possível obter uma resposta.");
      }

      const mensagemAssistente: Mensagem = {
        id: Date.now() + 1,
        papel: "assistant",
        conteudo: data.resposta,
        fontes: data.fontes ?? [],
      };

      setMensagens((anteriores) => [...anteriores, mensagemAssistente]);
    } catch (error) {
      console.error(error);
      setErroChat(
        error instanceof Error
          ? error.message
          : "Não foi possível obter uma resposta."
      );
    } finally {
      setCarregandoResposta(false);
      setTimeout(() => {
        fimMensagensRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6 text-violet-300"
                aria-hidden="true"
              >
                <path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z" />
                <path d="m8 10 4-2 4 2-4 2-4-2Z" />
                <path d="M8 14l4 2 4-2" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                AI Document Chat
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Converse com seus documentos usando IA e RAG.
              </p>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Base de conhecimento</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Envie um PDF para processar e consultar seu conteúdo.
            </p>
          </div>

          <div className="mb-5">
            <label
              htmlFor="documento"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Ou selecione um documento salvo
            </label>

            <select
              id="documento"
              value={documentId}
              onChange={(event) => {
                setDocumentId(event.target.value);
                setMensagens([]);
                setChunks([]);
                setEmbeddings([]);
                setQuantidadeChunks(0);
                setErroChat("");
              }}
              disabled={carregandoDocumentos || documentos.length === 0}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500 disabled:opacity-60"
            >
              <option value="">
                {carregandoDocumentos
                  ? "Carregando documentos..."
                  : "Selecione um documento"}
              </option>

              {documentos.map((documento) => (
                <option key={documento.id} value={documento.id}>
                  {documento.nome}
                </option>
              ))}
            </select>

            {erroDocumentos && (
              <p className="mt-2 text-sm text-amber-300">
                {erroDocumentos}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                setArquivo(event.target.files?.[0] ?? null);
                setErroArquivo("");
              }}
              className="block min-w-0 flex-1 text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-zinc-200 hover:file:bg-zinc-700"
            />

            <button
              onClick={enviarArquivo}
              disabled={!arquivo || carregandoArquivo}
              className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregandoArquivo ? "Processando PDF..." : "Processar PDF"}
            </button>
          </div>

          {erroArquivo && (
            <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">
              {erroArquivo}
            </p>
          )}

          {documentId && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border border-emerald-800 bg-emerald-950/40 px-3 py-1 text-emerald-300">
                PDF processado
              </span>
              <span className="text-zinc-400">
                {documentos.find((documento) => documento.id === documentId)?.nome
                  ?? arquivo?.name
                  ?? "Documento selecionado"}
                {quantidadeChunks > 0 ? ` · ${quantidadeChunks} chunks` : ""}
              </span>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M7 9h10M7 13h6" />
                <path d="M20 11.5a7.5 7.5 0 0 1-11.1 6.6L4 20l1.5-4.1A7.5 7.5 0 1 1 20 11.5Z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold">Converse com seu documento</h2>
              <p className="text-xs text-zinc-400">
                Respostas baseadas nos trechos recuperados do PDF.
              </p>
            </div>
          </div>

          <div className="flex min-h-[320px] flex-col">
            <div className="flex-1 space-y-5 p-4 sm:p-6">
              {mensagens.length === 0 && (
                <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-7 w-7 text-violet-300"
                      aria-hidden="true"
                    >
                      <path d="M8 10h8M8 14h5" />
                      <path d="M12 3a9 9 0 0 0-7.5 14L4 21l4-1.5A9 9 0 1 0 12 3Z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-zinc-200">
                    Sua próxima pergunta começa aqui
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                    {documentId
                      ? "Faça uma pergunta sobre o PDF que você acabou de processar."
                      : "Processe um PDF acima para consultar um documento específico."}
                  </p>
                  {documentId && (
                    <button
                      type="button"
                      onClick={() =>
                        setPergunta("Resuma os principais pontos deste documento.")
                      }
                      className="mt-5 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-violet-500/50 hover:bg-zinc-800"
                    >
                      Resumir o documento
                    </button>
                  )}
                </div>
              )}

              {mensagens.map((mensagem) => (
                <div
                  key={mensagem.id}
                  className={`flex ${
                    mensagem.papel === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 sm:max-w-[85%] ${
                      mensagem.papel === "user"
                        ? "bg-violet-600 text-white"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-7">
                      {mensagem.conteudo}
                    </p>

                    {mensagem.fontes && mensagem.fontes.length > 0 && (
                      <details className="mt-4 border-t border-zinc-700/70 pt-3">
                        <summary className="cursor-pointer text-xs font-medium text-violet-300">
                          Consultar fontes ({mensagem.fontes.length})
                        </summary>
                        <div className="mt-3 space-y-3">
                          {mensagem.fontes.map((fonte, index) => (
                            <div
                              key={fonte.id}
                              className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
                            >
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-zinc-300">
                                  Trecho {index + 1}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  Similaridade:{" "}
                                  {(fonte.similaridade * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-xs leading-5 text-zinc-400">
                                {fonte.trecho}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}

              {carregandoResposta && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                      Pesquisando o documento e preparando a resposta...
                    </span>
                  </div>
                </div>
              )}

              {erroChat && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300"
                >
                  {erroChat}
                </div>
              )}

              <div ref={fimMensagensRef} />
            </div>

            <form
              onSubmit={enviarPergunta}
              className="border-t border-zinc-800 bg-zinc-950/50 p-4 sm:p-5"
            >
              <label htmlFor="pergunta" className="sr-only">
                Sua pergunta
              </label>
              <div className="flex items-end gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 p-2 transition focus-within:border-violet-500/70">
                <textarea
                  id="pergunta"
                  value={pergunta}
                  onChange={(event) => setPergunta(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Pergunte algo sobre o documento..."
                  rows={1}
                  disabled={carregandoResposta}
                  className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!pergunta.trim() || carregandoResposta}
                  aria-label="Enviar pergunta"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M5 12 19 5l-4 14-3-6-7-1Z" />
                    <path d="m12 13 7-8" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-zinc-600">
                Enter para enviar · Shift + Enter para nova linha
              </p>
            </form>
          </div>
        </section>

        {chunks.length > 0 && (
          <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
            <details>
              <summary className="cursor-pointer font-medium text-zinc-300">
                Inspecionar processamento do PDF ({quantidadeChunks} chunks)
              </summary>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                <p>
                  Embeddings gerados:{" "}
                  <span className="font-semibold text-zinc-200">
                    {embeddings.length}
                  </span>
                </p>
                <p className="mt-1">
                  Dimensão de cada embedding:{" "}
                  <span className="font-semibold text-zinc-200">
                    {embeddings[0]?.length ?? 0}
                  </span>
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {chunks.map((chunk, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-medium text-zinc-300">
                        Chunk {index + 1}
                      </h3>
                      <span className="text-xs text-zinc-500">
                        {chunk.length} caracteres
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                      {chunk}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
      </div>
    </main>
  );
}
