# AI Proxy for Bible AI

This small proxy server forwards AI requests server-side so the web app doesn't expose API keys or encounter CORS issues. It is configured to use Google Generative API (AI Studio / PaLM).

Setup

1. Install dependencies

```bash
cd mobile/server
npm install
```

2. Configure environment variables (recommended in a `.env` file or shell):

- `EXPO_LOCAL_AI_STUB` (optional) — set to `true` to return only predefined canned replies indicating the AI is under training instead of calling external AI providers. Useful for development.
- `GOOGLE_API_KEY` or `EXPO_PUBLIC_GOOGLE_API_KEY` — API key for Google AI Studio / PaLM (required now).
- `GOOGLE_AI_MODEL` or `EXPO_PUBLIC_GOOGLE_AI_MODEL` (optional, default: `text-bison-001`)

Google AI Studio / PaLM usage
- To use Google Generative API, set `GOOGLE_API_KEY` (or `EXPO_PUBLIC_GOOGLE_API_KEY`) in your environment.
- Set `GOOGLE_AI_MODEL` to the model you'd like (default: `gemini-flash-latest`).
- The proxy calls the Google Gemini `generateContent` endpoint `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` for generation.

3. Start the proxy

```bash
npm start
```

4. Point your app to the proxy

- Ensure `EXPO_PUBLIC_API_URL` in `mobile/.env.local` is `http://localhost:3000` (or change the port)
- The app calls `POST /api/ai` with body `{ prompt: string, history?: [] }` and receives `{ text: string }`.

Notes

- This proxy is for development and testing. For production, secure it, add rate-limiting, auth, and host it on a reliable server.
- The proxy uses Node's global `fetch` (Node 18+). If using an older Node, install `node-fetch` and adjust the code.
