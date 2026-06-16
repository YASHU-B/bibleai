# Environment Setup Guide

## Prerequisites

Before running the Bible AI app, you need to set up your Supabase project and environment variables.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to **Settings → API** to find:
   - Project URL (copy this)
   - Anon Key (copy this)

## Step 2: Configure Environment Variables

1. Copy the `.env.local.example` file to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

3. (No additional AI provider configuration required) Configure `EXPO_PUBLIC_API_URL` to point to the backend proxy that handles AI requests. To use Google Generative API directly from the server, set `EXPO_PUBLIC_GOOGLE_API_KEY` and `EXPO_PUBLIC_GOOGLE_AI_MODEL` in `.env.local`.

4. Start the backend proxy server

```bash
cd mobile/server
npm install
npm start
```

5. Start the mobile app in a separate terminal:

```bash
cd mobile
npm start
# or
yarn start
```

Then press:
- `i` for iOS
- `a` for Android
- `w` for Web

6. For production, update `EXPO_PUBLIC_API_URL` to your backend API URL

## Backend API Setup

The app expects a backend API at `EXPO_PUBLIC_API_URL/api/ai` that accepts:

```json
POST /api/ai
{
  "prompt": "user message",
  "history": [ { "role": "user", "content": "..." }, ... ]
}
```

Response should be:
```json
{
  "text": "AI response text"
}
```

If the API is unavailable, the app will fall back to mock theological responses.

## Troubleshooting

- **"Supabase is not configured"**: Make sure `.env.local` exists and has valid credentials
- **API calls failing**: Check `EXPO_PUBLIC_API_URL` is correct and your backend is running
- **Auth not working**: Verify Supabase credentials and that auth is enabled in your Supabase project
