# Chatbot Framework - Upgrade Scope

## Goal
Match/beat WebFX Bronze-Silver tier at better pricing.

## Current State
- ✅ Admin dashboard (config: model, prompt, branding)
- ✅ Embeddable widget (chat bubble)
- ✅ Custom colors, business name, welcome message
- ❌ Rule-based responses only (no real AI)
- ❌ No persistence
- ❌ No knowledge base

## WebFX Comparison

| Feature | WebFX Bronze ($3k+$500/mo) | Us (Target) |
|---------|---------------------------|-------------|
| Real AI | ✅ Anthropic/OpenAI/Gemini | ✅ Phase 1 |
| Embed widget | ✅ | ✅ Already done |
| Custom branding | ✅ | ✅ Already done |
| Knowledge base | 500KB docs | ✅ Phase 2 |
| Conversation logs | 30 days | ✅ Phase 3 |
| Analytics | Basic | ✅ Phase 3 |
| Multi-tenant | ✅ | ✅ Phase 4 |

---

## Phase 1: Real AI Backend (Priority)
**Time: 2-3 hours**

- [ ] API route `/api/chat` with streaming
- [ ] OpenAI integration (GPT-4o-mini for cost efficiency)
- [ ] Anthropic integration (Claude 3 Haiku)
- [ ] System prompt injection
- [ ] Basic conversation memory (session-based)
- [ ] Update widget to call real API

## Phase 2: Knowledge Base (RAG)
**Time: 4-6 hours**

- [ ] Supabase pgvector setup
- [ ] Text/PDF upload endpoint
- [ ] Chunking + embedding generation
- [ ] RAG retrieval in chat API
- [ ] Admin UI for managing docs
- [ ] Website URL scraper (optional)

## Phase 3: Persistence & Analytics
**Time: 3-4 hours**

- [ ] Supabase tables: `chatbots`, `conversations`, `messages`
- [ ] Log all conversations
- [ ] Admin: conversation history viewer
- [ ] Basic analytics: message count, daily volume, top questions
- [ ] Export conversations (CSV)

## Phase 4: Multi-tenant & Auth
**Time: 3-4 hours**

- [ ] Supabase auth integration
- [ ] User can create multiple chatbots
- [ ] Per-chatbot API keys
- [ ] Usage tracking per chatbot
- [ ] Billing integration hooks

---

## Pricing Strategy (Beat WebFX)

| Tier | Setup | Monthly | Chats/mo | Target Margin |
|------|-------|---------|----------|---------------|
| Starter | $500 | $99 | 500 | High (rule-based fallback) |
| Pro | $1,500 | $249 | 2,500 | Medium |
| Business | $3,000 | $499 | 10,000 | Medium |

*WebFX charges $3k setup + $500/mo for 1000 chats. We undercut significantly.*

---

## Tech Stack
- **Frontend:** Next.js 14 (App Router)
- **AI:** OpenAI API, Anthropic API
- **Database:** Supabase (Postgres + pgvector)
- **Embeddings:** OpenAI text-embedding-3-small
- **Hosting:** Vercel

## API Keys Needed
- [x] Supabase (have it)
- [ ] OpenAI API key
- [ ] Anthropic API key (optional, for model choice)
