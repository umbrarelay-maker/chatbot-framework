-- Chatbot Framework Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector extension
create extension if not exists vector;

-- Chatbots table (multi-tenant ready)
create table if not exists chatbots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  system_prompt text default 'You are a helpful assistant.',
  welcome_message text default 'Hello! How can I help you today?',
  primary_color text default '#374151',
  model text default 'gpt-4o-mini',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents (knowledge base sources)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid references chatbots(id) on delete cascade not null,
  name text not null,
  source_type text not null check (source_type in ('text', 'pdf', 'url')),
  source_url text,
  content text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Document chunks with embeddings
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade not null,
  chatbot_id uuid references chatbots(id) on delete cascade not null,
  content text not null,
  chunk_index int not null,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid references chatbots(id) on delete cascade not null,
  session_id text not null, -- anonymous visitor session
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used int,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_document_chunks_chatbot on document_chunks(chatbot_id);
create index if not exists idx_conversations_chatbot on conversations(chatbot_id);
create index if not exists idx_messages_conversation on messages(conversation_id);

-- Vector similarity search index (IVFFlat for speed)
create index if not exists idx_chunks_embedding on document_chunks 
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RLS Policies
alter table chatbots enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Chatbots: users can only see their own
create policy "Users can view own chatbots" on chatbots
  for select using (auth.uid() = user_id);
create policy "Users can insert own chatbots" on chatbots
  for insert with check (auth.uid() = user_id);
create policy "Users can update own chatbots" on chatbots
  for update using (auth.uid() = user_id);
create policy "Users can delete own chatbots" on chatbots
  for delete using (auth.uid() = user_id);

-- Documents: through chatbot ownership
create policy "Users can manage documents" on documents
  for all using (
    chatbot_id in (select id from chatbots where user_id = auth.uid())
  );

-- Document chunks: through chatbot ownership  
create policy "Users can manage chunks" on document_chunks
  for all using (
    chatbot_id in (select id from chatbots where user_id = auth.uid())
  );

-- Conversations: public insert (visitors), owner can view
create policy "Anyone can create conversations" on conversations
  for insert with check (true);
create policy "Owners can view conversations" on conversations
  for select using (
    chatbot_id in (select id from chatbots where user_id = auth.uid())
  );

-- Messages: public insert, owner can view
create policy "Anyone can create messages" on messages
  for insert with check (true);
create policy "Owners can view messages" on messages
  for select using (
    conversation_id in (
      select c.id from conversations c
      join chatbots cb on c.chatbot_id = cb.id
      where cb.user_id = auth.uid()
    )
  );

-- Function: Vector similarity search
create or replace function match_chunks(
  query_embedding vector(1536),
  match_chatbot_id uuid,
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where chatbot_id = match_chatbot_id
    and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;
