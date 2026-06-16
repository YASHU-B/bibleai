/* Minimal proxy server to forward AI requests server-side.
 * - Protects API keys (Hugging Face)
 * - Enables web app to call POST /api/ai without CORS / key exposure
 *
 * Usage:
 * 1. cd mobile/server
 * 2. npm install
 * 3. Set env vars (see .env.example)
 *    - To enable server resend endpoint, add `SUPABASE_SERVICE_ROLE_KEY` and `EXPO_PUBLIC_SUPABASE_URL` in .env.local
 * 4. npm start
 */

const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Loaded GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY || 'not found');
console.log('Loaded EXPO_LOCAL_AI_STUB:', process.env.EXPO_LOCAL_AI_STUB || 'not found');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Feature flag to return a safe local stub instead of calling external AI providers.
const USE_LOCAL_AI_STUB = (process.env.EXPO_LOCAL_AI_STUB || process.env.USE_LOCAL_AI_STUB) === 'true';

// Optional Google Generative AI (AI Studio / PaLM) configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
const GOOGLE_AI_MODEL = process.env.GOOGLE_AI_MODEL || process.env.EXPO_PUBLIC_GOOGLE_AI_MODEL || 'gemini-flash-latest';

async function callGoogleGenerateContent(model, apiKey, text, options = {}) {
  if (!apiKey) throw new Error('Missing Google API key');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [
      { parts: [{ text }] }
    ],
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
    body: JSON.stringify(body),
  });

  const json = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(typeof json === 'string' ? json : JSON.stringify(json));
  }

  const candidates = json && (json.candidates || []);
  if (Array.isArray(candidates) && candidates.length > 0) {
    const c = candidates[0];
    const textOut = c && c.content && c.content.parts && c.content.parts[0] && c.content.parts[0].text;
    return textOut || c.output || null;
  }

  return json.output || json.result || null;
}

// Simple file-backed store for resend cooldowns (per-email)
const fs = require('fs');
const STORE_FILE = path.resolve(__dirname, 'resend_store.json');
const PREDEFINED_FILE = path.resolve(__dirname, 'predefined_responses.json');

function loadPredefined() {
  try {
    if (!fs.existsSync(PREDEFINED_FILE)) {
      fs.writeFileSync(PREDEFINED_FILE, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(PREDEFINED_FILE, 'utf8') || '{}');
  } catch (e) {
    console.warn('Failed to load predefined responses', e);
    return {};
  }
}

function savePredefined(map) {
  try {
    fs.writeFileSync(PREDEFINED_FILE, JSON.stringify(map || {}, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.warn('Failed to save predefined responses', e);
    return false;
  }
}

let predefinedMap = loadPredefined();

function getPredefinedResponse(key) {
  if (!key) return null;
  if (predefinedMap[key]) return predefinedMap[key];
  for (const k of Object.keys(predefinedMap)) {
    if (!k) continue;
    if ((key && key.includes(k)) || (k && k.includes(key))) return predefinedMap[k];
  }
  return null;
}
function loadStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) return {};
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8') || '{}');
  } catch (e) {
    console.warn('Failed to read resend store', e);
    return {};
  }
}
function saveStore(store) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store || {}));
  } catch (e) {
    console.warn('Failed to write resend store', e);
  }
}

// POST /resend-confirmation
// body: { email }
// Enforces a server-side cooldown to avoid hammering the email provider
app.post('/resend-confirmation', async (req, res) => {
  try {
    const email = (req.body && req.body.email) || '';
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Missing email' });

    const COOLDOWN_SECONDS = parseInt(process.env.RESEND_COOLDOWN_SECONDS || '300', 10); // default 5 minutes
    const now = Math.floor(Date.now() / 1000);

    const store = loadStore();
    const last = store[email]?.last || 0;
    if (now - last < COOLDOWN_SECONDS) {
      const wait = COOLDOWN_SECONDS - (now - last);
      return res.status(429).json({ error: 'rate limit', wait });
    }

    // Call Supabase auth OTP endpoint using service role key
    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return res.status(500).json({ error: 'Supabase service role key not configured on server' });
    }

    const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/otp`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({ email }),
    });

    const body = await resp.json().catch(() => null);
    if (!resp.ok) {
      // If Supabase/email provider reports rate limit, store the timestamp
      if (resp.status === 429 || (body && /rate limit/i.test(JSON.stringify(body)))) {
        store[email] = { last: now };
        saveStore(store);
        return res.status(429).json({ error: 'rate limit', detail: body || null });
      }
      return res.status(502).json({ error: 'upstream error', detail: body || null });
    }

    // success — record timestamp
    store[email] = { last: now };
    saveStore(store);
    return res.json({ ok: true, detail: body || null });
  } catch (err) {
    console.error('resend-confirmation error', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Simple root route to confirm server is running
app.get('/', (req, res) => {
  res.send('<h1>Bible AI Proxy</h1><p>POST /api/ai to use the proxy. See server logs for details.</p>');
});

// POST /api/ai
// body: { prompt: string, history?: Array<{role,content}> }
app.post('/api/ai', async (req, res) => {
  try {
    if (USE_LOCAL_AI_STUB) { 
      const text = (req.body && (req.body.prompt || req.body.input)) || '';
      const normalize = s => String(s || '').toLowerCase().replace(/[^ \p{L}\p{N}\p{M}\s]/gu, ' ').replace(/\s+/g, ' ').trim(); 
      const key = normalize(text);
      console.log('STUB /api/ai incoming text:', JSON.stringify(text), 'normalized key:', JSON.stringify(key));
      const resp = getPredefinedResponse(key);
      if (resp) return res.json({ text: resp });
      return res.json({ text: "The AI assistant is currently under training and only responds to a small set of predefined prompts. Try: Hello, Who is Jesus, What is the Bible, Prayer, John 3:16." });
    }
    const { prompt, input, history } = req.body || {};
    const text = prompt || input;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing prompt/input string' });
    }

    // Use Google Generative API if available.
    if (GOOGLE_API_KEY) {
      try {
        const gtext = await callGoogleGenerateContent(GOOGLE_AI_MODEL, GOOGLE_API_KEY, text, { temperature: 0.7, maxOutputTokens: 256 });
        if (gtext) return res.json({ text: gtext });
      } catch (gErr) {
        console.warn('Google Generative API call failed:', gErr && gErr.message ? gErr.message : gErr);
        // Surface the actual provider error (quota, auth, etc.) to the caller
        const errMsg = gErr && gErr.message ? gErr.message : String(gErr);
        const isQuotaExceeded = errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
        if (isQuotaExceeded) {
          return res.status(429).json({ 
            error: 'API quota exceeded. Please try again later (quota resets daily).',
            detail: 'Gemini API free-tier quota limit reached.',
            retryAfter: 3600
          });
        }
        return res.status(502).json({ error: 'AI service temporarily unavailable', detail: errMsg });
      }
    }

    return res.status(500).json({ error: 'No AI provider configured. Set GOOGLE_API_KEY.' });
  } catch (err) {
    console.error('Proxy error', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/assistant
// body: { query: string }
app.post('/api/assistant', async (req, res) => {
  try {
    if (USE_LOCAL_AI_STUB) {
      const query = (req.body && req.body.query) || '';
      const normalize = s => String(s || '').toLowerCase().replace(/[^ \p{L}\p{N}\p{M}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
      const key = normalize(query);
      console.log('STUB /api/assistant incoming query:', JSON.stringify(query), 'normalized key:', JSON.stringify(key));
      const resp = getPredefinedResponse(key);
      if (resp) return res.json({ answer: resp, sources: [], note: 'predefined-stub' });
      return res.json({ answer: `The AI assistant is under training and responds only to predefined prompts. Try: Hello, Who is Jesus, What is the Bible, Prayer.`, sources: [], note: 'predefined-stub' });
    }
    const query = (req.body && req.body.query) || '';
    if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Missing query string' });

    // RAG assistant using Hugging Face has been removed.
    // For now, this endpoint requires server-side implementation for embeddings+RAG using Google or another provider.
    return res.status(501).json({ error: 'RAG assistant disabled. Configure server-side embeddings and generation (Google AI or other).' });
  } catch (err) {
    console.error('assistant error', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// wire admin endpoints (edit predefined responses at runtime)
try {
  require('./admin_endpoints')(app, fs, PREDEFINED_FILE, loadPredefined, savePredefined);
} catch (e) {
  console.warn('Failed to load admin_endpoints module', e);
}

app.listen(PORT, () => {
  console.log(`AI proxy listening on http://localhost:${PORT}`);
});
