import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

let openai: OpenAI | null = null;
let supabase: ReturnType<typeof createClient> | null = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

function getSupabase() {
  if (!supabase && supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

// Chunk text for embedding
function chunkText(text: string, maxTokens = 500): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;
  
  for (const word of words) {
    const wordTokens = Math.ceil(word.length / 4);
    if (currentLength + wordTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      const overlapWords = currentChunk.slice(-20);
      currentChunk = overlapWords;
      currentLength = overlapWords.join(' ').length / 4;
    }
    currentChunk.push(word);
    currentLength += wordTokens;
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  
  return chunks;
}

// Generate embedding
async function getEmbedding(text: string): Promise<number[] | null> {
  const client = getOpenAI();
  if (!client) return null;
  
  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding error:', error);
    return null;
  }
}

// GET - List documents for a chatbot
export async function GET(request: NextRequest) {
  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const chatbotId = request.nextUrl.searchParams.get('chatbotId');
  if (!chatbotId) {
    return NextResponse.json({ error: 'chatbotId required' }, { status: 400 });
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from('documents')
    .select('*')
    .eq('chatbot_id', chatbotId)
    .order('created_at', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ documents: data });
}

// POST - Upload and process a document
export async function POST(request: NextRequest) {
  const db = getSupabase();
  const ai = getOpenAI();
  
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  try {
    const body = await request.json();
    const { chatbotId, name, content, sourceType = 'text', sourceUrl } = body;
    
    if (!chatbotId || !name || !content) {
      return NextResponse.json(
        { error: 'chatbotId, name, and content required' },
        { status: 400 }
      );
    }
    
    // Create document record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: doc, error: docError } = await (db as any)
      .from('documents')
      .insert({
        chatbot_id: chatbotId,
        name,
        content,
        source_type: sourceType,
        source_url: sourceUrl,
      })
      .select()
      .single();
    
    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 });
    }
    
    // Chunk the content
    const chunks = chunkText(content);
    
    // Process chunks with embeddings
    const chunkRecords = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      let embedding = null;
      
      // Generate embedding if OpenAI is available
      if (ai) {
        embedding = await getEmbedding(chunkContent);
      }
      
      chunkRecords.push({
        document_id: doc.id,
        chatbot_id: chatbotId,
        content: chunkContent,
        chunk_index: i,
        embedding,
      });
    }
    
    // Insert chunks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: chunkError } = await (db as any)
      .from('document_chunks')
      .insert(chunkRecords);
    
    if (chunkError) {
      // Rollback document if chunks fail
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from('documents').delete().eq('id', doc.id);
      return NextResponse.json({ error: chunkError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      document: doc,
      chunksCreated: chunks.length,
      embeddingsGenerated: ai ? chunks.length : 0,
    });
    
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a document and its chunks
export async function DELETE(request: NextRequest) {
  const db = getSupabase();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const documentId = request.nextUrl.searchParams.get('id');
  if (!documentId) {
    return NextResponse.json({ error: 'Document id required' }, { status: 400 });
  }
  
  // Chunks are deleted via cascade
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from('documents')
    .delete()
    .eq('id', documentId);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
