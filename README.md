# AI Document Chat — RAG with Next.js, Gemini and Supabase

A document-based AI chat application that allows users to upload PDF files and ask questions about their content using Retrieval-Augmented Generation (RAG).

The application extracts text from uploaded documents, splits it into chunks, generates vector embeddings, and stores them in Supabase. When a user asks a question, the system retrieves the most relevant passages and uses Google's Gemini model to generate a contextual answer grounded in the document.

## Features

- **PDF Upload and Processing** — Upload PDF documents and extract their text.
- **Text Chunking** — Split document content into smaller overlapping sections for retrieval.
- **Vector Embeddings** — Generate document and query embeddings using Google's Gemini embedding model.
- **Vector Search** — Retrieve relevant document passages using Supabase and PostgreSQL vector similarity search.
- **Context-Aware Chat** — Ask questions about a selected document and receive answers based on its content.
- **Source References** — Inspect the passages used to generate an answer, including similarity scores.
- **Document Selection** — Choose which uploaded document to use as the context for a conversation.
- **Input Validation** — Validate questions, embedding dimensions, and document retrieval results.
- **Responsive Interface** — A modern dark-themed interface built with React and Tailwind CSS.

## How It Works

The application uses a Retrieval-Augmented Generation (RAG) pipeline.

1. **Upload:** The user uploads a PDF document.
2. **Extract:** The application extracts the text from the PDF.
3. **Chunk:** The text is divided into smaller, overlapping chunks.
4. **Embed:** Each chunk is converted into a vector embedding.
5. **Store:** The chunks and embeddings are stored in Supabase.
6. **Retrieve:** When the user asks a question, the application generates a query embedding and searches for the most similar document chunks.
7. **Generate:** The retrieved passages are sent to Gemini as context.
8. **Answer:** Gemini generates an answer in Portuguese, grounded in the retrieved content.
9. **Verify:** The user can inspect the source passages used to produce the answer.

## Architecture

```text
                  ┌─────────────────────┐
                  │     Next.js UI      │
                  │ PDF Upload & Chat   │
                  └──────────┬──────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
          Document API              Chat API
                 │                       │
          Extract PDF Text        Generate Query Embedding
                 │                       │
          Split into Chunks        Vector Similarity Search
                 │                       │
          Generate Embeddings      Retrieve Relevant Chunks
                 │                       │
                 ▼                       ▼
          ┌──────────────────────────────────┐
          │             Supabase             │
          │ PostgreSQL + pgvector             │
          │ Documents, Chunks and Embeddings  │
          └──────────────────┬───────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │    Google Gemini    │
                  │ Contextual Answers  │
                  └─────────────────────┘
```

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Full-stack application and API routes |
| React | Interactive user interface |
| TypeScript | Type safety |
| Tailwind CSS | Interface styling |
| Google Gemini API | Answer generation and embeddings |
| Supabase | Database and backend services |
| PostgreSQL with pgvector | Vector storage and similarity search |
| unpdf | PDF text extraction |
| Vercel | Deployment platform |

## Getting Started

### Prerequisites

Before running the project, make sure you have:

- Node.js installed
- npm installed
- A Google AI API key
- A Supabase project with the required database schema and vector search function

### 1. Clone the repository

```bash
git clone https://github.com/josecarlosfreitas/ai-document-chat.git
cd ai-document-chat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Replace the example values with your actual credentials. If the project uses different environment variable names, keep them consistent with the application's configuration.

**Security:** Never commit `.env.local` or expose your Supabase service role key in client-side code. Keep privileged credentials on the server.

### 4. Configure Supabase

The database requires two tables:

- `documents` — Stores document metadata.
- `document_chunks` — Stores text chunks, document references, and vector embeddings.

The `document_chunks.embedding` column uses a vector dimension of `3072`, matching the embedding model configuration.

The project also requires a PostgreSQL function named `match_document_chunks` to retrieve the most relevant chunks using vector similarity.

Make sure the Supabase project has the required `pgvector` extension, tables, function, and permissions configured before testing the application.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Example Use Case

Imagine uploading an internal company manual containing information about a fictional company called TechNova.

You can ask:

> In what year was TechNova founded?

The application searches the document for relevant passages and uses those passages to generate an answer. You can also inspect the retrieved sources to understand which parts of the document supported the response.

## Key AI Concepts Demonstrated

### Retrieval-Augmented Generation (RAG)

RAG combines information retrieval with a language model. Instead of relying only on the model's pretrained knowledge, the application retrieves relevant information from the user's documents and supplies it as context.

### Embeddings

Embeddings represent text as numerical vectors. Texts with similar semantic meanings can have similar vector representations, enabling retrieval based on meaning rather than exact keyword matches alone.

### Vector Similarity Search

The application compares a question embedding with stored document embeddings to identify potentially relevant passages.

### Grounded Generation

The model receives the retrieved passages as context and is instructed to answer using the supplied information instead of inventing unsupported details.

### Source Transparency

The application displays retrieved passages and similarity scores, helping users inspect the context used to generate an answer. Similarity scores are retrieval signals, not guarantees that an answer is correct.

## Project Goals

This project was built as part of a hands-on AI engineering portfolio, focusing on practical implementation rather than a purely theoretical demonstration.

It explores how to:

- Integrate an LLM into a full-stack application.
- Build a document ingestion pipeline.
- Generate and store embeddings.
- Implement semantic retrieval with a vector database.
- Connect retrieval results to an LLM.
- Design APIs for AI-powered features.
- Build an interface for inspecting AI-generated answers and their sources.

## Future Improvements

Possible next steps include:

- Support for additional document formats.
- Streaming AI responses.
- Conversation history and multi-turn document chat.
- Improved retrieval through metadata filtering and reranking.
- Authentication and per-user document access.
- Automated evaluation of retrieval quality and answer accuracy.

## Author

**José Carlos Freitas**

Software developer exploring AI engineering through practical projects.

GitHub: [@josecarlosfreitas](https://github.com/josecarlosfreitas)
