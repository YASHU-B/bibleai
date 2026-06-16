The previous Hugging Face ingest script has been removed. To ingest embeddings you can implement a new script using a provider of your choice (for example Google Embeddings API or Hugging Face) and the `supabase` upsert RPC `bible_embeddings`.

Prereqs
- Node 18+
- A Supabase project with `pgvector` enabled and the `bible_embeddings` table created (see `supabase/create_bible_embeddings_table.sql`).
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (service role key needed for upsert).

Install deps

```bash
cd mobile
npm install @supabase/supabase-js dotenv
```

You will need to provide an embeddings provider and implement a new ingest script accordingly.
