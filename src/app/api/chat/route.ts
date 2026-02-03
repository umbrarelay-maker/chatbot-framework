import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Provider detection
function getProvider(model: string): 'openai' | 'anthropic' | 'google' {
  if (model.startsWith('gpt-') || model.startsWith('o1')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('gemini-')) return 'google';
  return 'openai'; // default
}

// Model mapping to actual API model names
function getApiModel(model: string): string {
  const modelMap: Record<string, string> = {
    // OpenAI
    'gpt-5.2': 'gpt-5.2',
    'gpt-5.2-mini': 'gpt-5.2-mini',
    // Anthropic
    'claude-haiku-4.5': 'claude-3-5-haiku-latest',
    'claude-sonnet-4': 'claude-sonnet-4-20250514',
    // Google
    'gemini-3-flash': 'gemini-2.0-flash',
    'gemini-3-pro': 'gemini-2.0-pro',
  };
  return modelMap[model] || model;
}

// Initialize clients lazily
let openai: OpenAI | null = null;
let supabase: ReturnType<typeof createClient> | null = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

function getAnthropic() {
  // Return config for Anthropic API
  if (process.env.ANTHROPIC_API_KEY) {
    return { apiKey: process.env.ANTHROPIC_API_KEY };
  }
  return null;
}

function getGoogle() {
  // Return config for Google API
  if (process.env.GOOGLE_AI_API_KEY) {
    return { apiKey: process.env.GOOGLE_AI_API_KEY };
  }
  return null;
}

function getSupabase() {
  if (!supabase && supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

// Generate embedding (OpenAI only for now)
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

// RAG: Find relevant chunks
async function findRelevantChunks(
  chatbotId: string,
  query: string,
  limit = 5
): Promise<string[]> {
  const db = getSupabase();
  if (!db) return [];
  
  const embedding = await getEmbedding(query);
  if (!embedding) return [];
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db.rpc as any)('match_chunks', {
      query_embedding: embedding,
      match_chatbot_id: chatbotId,
      match_threshold: 0.5,
      match_count: limit,
    });
    
    if (error) {
      console.error('RAG search error:', error);
      return [];
    }
    
    return data?.map((chunk: { content: string }) => chunk.content) || [];
  } catch (error) {
    console.error('RAG error:', error);
    return [];
  }
}

// Rule-based fallback
function generateFallbackResponse(message: string, businessName: string): string {
  const lower = message.toLowerCase();
  
  if (lower.match(/^(hi|hello|hey)/)) {
    return `Hello! Welcome to ${businessName}. How can I help you today?`;
  }
  if (lower.includes('hours') || lower.includes('open')) {
    return `For our business hours, please check our website or contact us directly.`;
  }
  if (lower.includes('contact') || lower.includes('email') || lower.includes('phone')) {
    return `You can reach us through our contact page. How else can I help?`;
  }
  if (lower.includes('price') || lower.includes('cost')) {
    return `For pricing information, please contact our team for a customized quote.`;
  }
  if (lower.includes('thank')) {
    return `You're welcome! Is there anything else I can help with?`;
  }
  
  return `Thanks for your message! I'm currently running in demo mode. For more detailed assistance, please contact our team directly.`;
}

// OpenAI chat completion
async function chatWithOpenAI(
  messages: Array<{ role: string; content: string }>,
  model: string,
  systemPrompt: string,
  clientApiKey?: string
) {
  // Use client key if provided, otherwise fall back to env
  const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  
  const client = new OpenAI({ apiKey });

  const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  return client.chat.completions.create({
    model: getApiModel(model),
    messages: chatMessages,
    stream: true,
    max_tokens: 1000,
  });
}

// Anthropic chat completion
async function chatWithAnthropic(
  messages: Array<{ role: string; content: string }>,
  model: string,
  systemPrompt: string,
  clientApiKey?: string
) {
  const apiKey = clientApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: getApiModel(model),
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  return response;
}

// Google chat completion
async function chatWithGoogle(
  messages: Array<{ role: string; content: string }>,
  model: string,
  systemPrompt: string,
  clientApiKey?: string
) {
  const apiKey = clientApiKey || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${getApiModel(model)}:streamGenerateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 1000 },
      }),
    }
  );

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatbotId, messages, config } = body;
    
    const systemPrompt = config?.systemPrompt || 'You are a helpful assistant.';
    const businessName = config?.businessName || 'Our Business';
    const model = config?.model || 'gemini-3-flash';
    const provider = getProvider(model);
    const clientApiKey = config?.apiKey; // Client-provided API key
    
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    // RAG: Get relevant context
    let contextChunks: string[] = [];
    if (chatbotId) {
      contextChunks = await findRelevantChunks(chatbotId, lastMessage);
    }
    
    // Build system prompt with RAG context
    let fullSystemPrompt = systemPrompt;
    if (contextChunks.length > 0) {
      fullSystemPrompt += `\n\n## Relevant Knowledge Base Information:\n${contextChunks.join('\n\n---\n\n')}\n\nUse this information to help answer the user's question when relevant.`;
    }

    // Try provider-specific chat
    const encoder = new TextEncoder();

    if (provider === 'openai') {
      const stream = await chatWithOpenAI(messages, model, fullSystemPrompt, clientApiKey);
      if (!stream) {
        const fallback = generateFallbackResponse(lastMessage, businessName);
        return new Response(JSON.stringify({ content: fallback, mode: 'demo' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    if (provider === 'anthropic') {
      const response = await chatWithAnthropic(messages, model, fullSystemPrompt, clientApiKey);
      if (!response) {
        const fallback = generateFallbackResponse(lastMessage, businessName);
        return new Response(JSON.stringify({ content: fallback, mode: 'demo' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Pass through the SSE stream from Anthropic
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    if (provider === 'google') {
      const response = await chatWithGoogle(messages, model, fullSystemPrompt, clientApiKey);
      if (!response) {
        const fallback = generateFallbackResponse(lastMessage, businessName);
        return new Response(JSON.stringify({ content: fallback, mode: 'demo' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Transform Google's response to SSE format
      const reader = response.body?.getReader();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            if (!reader) {
              controller.close();
              return;
            }
            const decoder = new TextDecoder();
            let buffer = '';
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              
              // Parse Google's JSON stream
              try {
                const lines = buffer.split('\n');
                for (const line of lines) {
                  if (line.trim().startsWith('{')) {
                    const parsed = JSON.parse(line);
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
                    }
                  }
                }
                buffer = '';
              } catch {
                // Keep buffer for incomplete JSON
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Fallback
    const fallback = generateFallbackResponse(lastMessage, businessName);
    return new Response(JSON.stringify({ content: fallback, mode: 'demo' }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
