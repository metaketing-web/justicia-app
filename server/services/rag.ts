/**
 * RAG (Retrieval-Augmented Generation) Service
 * Handles document processing, chunking, embedding generation, and semantic search
 */

import { invokeLLM } from "../_core/llm";
import { 
  createDocumentChunks, 
  getChunksByDocumentId, 
  deleteChunksByDocumentId,
  getAllChunksForUser,
  updateDocument,
  getDocumentById
} from "../db";
import { storageGet } from "../storage";

// Configuration
const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks
const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * Extract text content from a document based on its file type
 */
export async function extractTextFromDocument(documentId: number): Promise<string> {
  const doc = await getDocumentById(documentId);
  if (!doc || !doc.fileKey) {
    throw new Error("Document not found or has no file");
  }

  const { url } = await storageGet(doc.fileKey);
  
  // Fetch the file content
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }

  const fileType = doc.fileType?.toLowerCase() || "";
  
  // For text-based files, read directly
  if (fileType === "txt" || fileType === "md" || fileType === "json") {
    return await response.text();
  }

  // For PDF and DOCX, use LLM with file URL to extract text
  if (fileType === "pdf" || fileType === "docx") {
    const extractionResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a document text extractor. Extract all text content from the provided document. Return only the extracted text without any additional formatting or commentary."
        },
        {
          role: "user",
          content: [
            {
              type: "file_url",
              file_url: {
                url: url,
                mime_type: fileType === "pdf" ? "application/pdf" : undefined
              }
            },
            {
              type: "text",
              text: "Please extract all text content from this document."
            }
          ]
        }
      ]
    });

    const content = extractionResult.choices[0]?.message?.content;
    return typeof content === 'string' ? content : "";
  }

  // Default: try to read as text
  return await response.text();
}

/**
 * Split text into overlapping chunks for better context preservation
 */
export function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  
  if (text.length <= chunkSize) {
    return [text];
  }

  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    // Try to break at sentence or paragraph boundary
    if (endIndex < text.length) {
      const searchArea = text.slice(endIndex - 100, endIndex + 100);
      const sentenceEnd = searchArea.search(/[.!?]\s/);
      if (sentenceEnd !== -1) {
        endIndex = endIndex - 100 + sentenceEnd + 2;
      }
    }

    const chunk = text.slice(startIndex, Math.min(endIndex, text.length)).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
  }

  return chunks;
}

/**
 * Generate embedding for a text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await invokeLLM({
    messages: [
      {
        role: "user",
        content: text
      }
    ],
    // Note: For actual embeddings, you would use the embeddings API
    // This is a simplified version using the chat model
  });

  // For now, we'll create a simple hash-based pseudo-embedding
  // In production, use the actual OpenAI embeddings API
  const embedding = createSimpleEmbedding(text);
  return embedding;
}

/**
 * Create a simple embedding based on text features
 * This is a placeholder - in production, use OpenAI's embedding API
 */
function createSimpleEmbedding(text: string, dimensions: number = 256): number[] {
  const embedding: number[] = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const index = (charCode * (i + 1) * (j + 1)) % dimensions;
      embedding[index] += 1 / (i + 1);
    }
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Process a document for RAG: extract text, chunk, generate embeddings
 */
export async function processDocumentForRAG(documentId: number): Promise<void> {
  // Update status to processing
  await updateDocument(documentId, { isProcessed: "processing" });

  try {
    // Delete existing chunks
    await deleteChunksByDocumentId(documentId);

    // Extract text
    const text = await extractTextFromDocument(documentId);
    
    if (!text || text.trim().length === 0) {
      await updateDocument(documentId, { isProcessed: "failed" });
      throw new Error("No text content extracted from document");
    }

    // Chunk the text
    const textChunks = chunkText(text);

    // Generate embeddings and save chunks
    const chunksToInsert = await Promise.all(
      textChunks.map(async (content, index) => {
        const embedding = await generateEmbedding(content);
        return {
          documentId,
          chunkIndex: index,
          content,
          embedding,
          tokenCount: Math.ceil(content.length / 4), // Rough estimate
        };
      })
    );

    await createDocumentChunks(chunksToInsert);

    // Update status to completed
    await updateDocument(documentId, { isProcessed: "completed" });
  } catch (error) {
    await updateDocument(documentId, { isProcessed: "failed" });
    throw error;
  }
}

/**
 * Search for relevant chunks across user's documents
 */
export async function searchDocuments(
  userId: number, 
  query: string, 
  topK: number = 5
): Promise<Array<{ content: string; documentTitle: string; documentId: number; score: number }>> {
  // Get all chunks for user
  const allChunks = await getAllChunksForUser(userId);
  
  if (allChunks.length === 0) {
    return [];
  }

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Calculate similarity scores
  const scoredChunks = allChunks
    .filter(chunk => chunk.embedding && Array.isArray(chunk.embedding))
    .map(chunk => ({
      content: chunk.content,
      documentTitle: chunk.documentTitle,
      documentId: chunk.documentId,
      score: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scoredChunks;
}

/**
 * Generate a RAG-augmented response using retrieved context
 */
export async function generateRAGResponse(
  userId: number,
  query: string,
  systemPrompt?: string
): Promise<{ response: string; sources: Array<{ documentTitle: string; content: string }> }> {
  // Search for relevant chunks
  const relevantChunks = await searchDocuments(userId, query, 5);

  // Build context from retrieved chunks
  const context = relevantChunks
    .map((chunk, i) => `[Source ${i + 1}: ${chunk.documentTitle}]\n${chunk.content}`)
    .join("\n\n---\n\n");

  // Generate response with context
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: systemPrompt || `Vous êtes un assistant juridique expert. Utilisez le contexte fourni pour répondre aux questions de manière précise et professionnelle. Si l'information n'est pas dans le contexte, dites-le clairement.

Contexte des documents:
${context}`
      },
      {
        role: "user",
        content: query
      }
    ]
  });

  const responseContent = response.choices[0]?.message?.content;
  return {
    response: typeof responseContent === 'string' ? responseContent : "Je n'ai pas pu générer une réponse.",
    sources: relevantChunks.map(chunk => ({
      documentTitle: chunk.documentTitle,
      content: chunk.content.slice(0, 200) + "..."
    }))
  };
}
