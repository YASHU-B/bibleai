import { Platform } from 'react-native';
import { books, verses, Verse } from './bibleData';
import { loadOfflineBibleChapter } from './offlineBibleData';
import { getLocalAssistantResponse, Language } from './localAssistantResponses';

export interface AssistantMessage {
  role: 'user' | 'model';
  content: string;
}

function normalize(text: string) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s:]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseBibleReference(text: string) {
  const normalized = normalize(text);
  for (const book of books) {
    const bookName = normalize(book.name_en);
    const pattern = new RegExp(`\\b${escapeRegExp(bookName)}\\b\\s+(\\d+)(?::|\\.|\\s+)(\\d+)`);
    const match = normalized.match(pattern);
    if (match) {
      return {
        bookId: book.id,
        bookName: book.name_en,
        chapter: Number(match[1]),
        verse: Number(match[2]),
      };
    }
  }
  return null;
}

function normalizeSearch(text: string) {
  return normalize(text)
    .replace(/\b(the|and|or|for|with|from|about|that|this|is|are|of|to|in)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatVerse(verse: Verse, language: Language) {
  const book = books.find(b => b.id === verse.book_id)?.name_en || `Book ${verse.book_id}`;
  const text = language === 'en' ? verse.text_en : (verse.text_te?.trim() ? verse.text_te : verse.text_en);
  return `(${book} ${verse.chapter}:${verse.verse}) ${text}`;
}

function getTopBibleVerses(input: string, maxResults = 3): Verse[] {
  const query = normalizeSearch(input);
  if (!query) return [];
  const terms = query.split(' ').filter(Boolean);
  if (terms.length === 0) return [];

  return verses
    .map(verse => {
      const haystack = normalize(`${verse.text_en} ${verse.text_te}`);
      const score = terms.reduce((count, term) => count + (haystack.includes(term) ? 1 : 0), 0);
      return { verse, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.verse);
}

async function getBibleSearchReply(input: string, language: Language): Promise<string | null> {
  const matchedVerses = getTopBibleVerses(input, 3);
  if (matchedVerses.length === 0) return null;
  const heading = language === 'en'
    ? 'Here are some verses related to your question:'
    : 'ఈ ప్రశ్నకి సంబంధించిన కొన్ని వచనాలు:';
  return `${heading}\n${matchedVerses.map(verse => formatVerse(verse, language)).join('\n')}`;
}

function getSpiritualTopicReply(input: string, language: Language): string | null {
  const normalized = normalize(input);
  const topics = [
    { keys: ['faith', 'belief', 'నమ్మకం', 'విశ్వాసం'], label: 'faith' },
    { keys: ['love', 'ప్రేమ'], label: 'love' },
    { keys: ['peace', 'శాంతి'], label: 'peace' },
    { keys: ['anxiety', 'fear', 'భయం', 'ఆందోళన'], label: 'comfort' },
    { keys: ['prayer', 'ప్రార్థన'], label: 'prayer' },
    { keys: ['forgiveness', 'క్షమించు', 'క్షమించుము'], label: 'forgiveness' },
    { keys: ['guidance', 'గైడెన్స్', 'దారి', 'దారి చూపించు'], label: 'guidance' },
    { keys: ['strength', 'బలము', 'శక్తి'], label: 'strength' },
  ];

  const topic = topics.find(t => t.keys.some(key => normalized.includes(key)));
  if (!topic) return null;
  const topicPrompts: Record<string, { en: string; te: string }> = {
    faith: {
      en: 'If you want to learn about faith, read these verses.',
      te: 'మీరు దేవునిపై నమ్మకాన్ని గురించి తెలుసుకోవాలనుకుంటున్నారో, ఈ వచనాలను చదవండి.',
    },
    love: {
      en: 'These verses speak about God’s love and how we should love others.',
      te: 'ప్రేమ మరియు దేవుని దయ గురించి ఈ వచనాలను చూడండి.',
    },
    peace: {
      en: 'These verses can help you find peace in your heart.',
      te: 'ఆత్మపరిశాంతి కోసం ఈ వచనాలు మీకు బాగా సహాయపడతాయి.',
    },
    comfort: {
      en: 'These verses offer comfort for anxiety and fear.',
      te: 'ఆందోళనకు శాంతి కోరుకునే వచనాలు ఇవి.',
    },
    prayer: {
      en: 'These verses are about prayer and connecting with God. I can also offer a short prayer.',
      te: 'ప్రార్థన మరియు దేవునితో సంబంధం కోసం ఈ వచనాలు.',
    },
    forgiveness: {
      en: 'These verses are about forgiveness and cleansing of the heart.',
      te: 'క్షమ మరియు శుభ్రత గురించి ఈ వచనాలు.',
    },
    guidance: {
      en: 'These verses can guide you when you need direction.',
      te: 'దగ్గరగా వెళ్ళే మార్గం కోసం దేవుని వాక్యాన్ని చూడండి.',
    },
    strength: {
      en: 'These verses can strengthen your spirit when you feel weak.',
      te: 'బలంగా ఉండడానికి ఆధ్యాత్మిక సహాయం కావాలనుకుంటే ఈ వచనాలు.',
    },
  };

  return topicPrompts[topic.label][language];
}

async function getBibleAnswer(input: string, language: Language): Promise<string | null> {
  const topicReply = getSpiritualTopicReply(input, language);
  if (topicReply) {
    const verseReply = await getBibleSearchReply(input, language);
    return verseReply ? `${topicReply}\n${verseReply}` : topicReply;
  }

  return getBibleSearchReply(input, language);
}

async function getBibleReferenceReply(input: string, language: Language): Promise<string | null> {
  const reference = parseBibleReference(input);
  if (!reference) return null;

  const chapterVerses = await loadOfflineBibleChapter(reference.bookId, reference.chapter, []);
  if (!chapterVerses || chapterVerses.length === 0) return null;

  const verse = chapterVerses.find(v => v.verse === reference.verse);
  if (!verse) return null;

  const verseText = language === 'en' ? verse.text_en : (verse.text_te?.trim() ? verse.text_te : verse.text_en);
  return `(${reference.bookName} ${reference.chapter}:${reference.verse}) ${verseText}`;
}

async function getLocalAssistantFallback(input: string, language: Language): Promise<string | null> {
  const localResponse = getLocalAssistantResponse(input, language);
  if (localResponse) return localResponse;

  // Only return Bible passages if the user explicitly requests scripture
  function wantsScripture(text: string) {
    const n = normalize(text);
    const keywords = ['verse', 'verses', 'scripture', 'bible', 'passage', 'cite', 'citation', 'quote', 'quotes', 'show me'];
    if (parseBibleReference(text)) return true;
    return keywords.some(k => n.includes(k));
  }

  // If user explicitly asked for scripture or a verse reference, return matching passages
  if (wantsScripture(input)) {
    const bibleResponse = await getBibleReferenceReply(input, language);
    if (bibleResponse) return bibleResponse;
    const bibleAnswer = await getBibleAnswer(input, language);
    if (bibleAnswer) return bibleAnswer;
  }

  // Try to provide a short topical reply (non-scriptural)
  const topical = getSpiritualTopicReply(input, language);
  if (topical) return topical;

  // Friendly conversational fallback (avoid dumping verses)
  if (language === 'en') {
    return "I'm here to help — could you say a bit more about what you mean, or would you like a short explanation or Bible passages?";
  }
  return 'నాకు సహాయం చేయడానికి సిద్దంగా ఉన్నాను — మీరు కాస్త వివరంగా చెప్పగలరా, లేక సంభాషణలో చిన్న వివరణ కావాలా లేదా బైబిల్ వచనాలు కావాలా?';
}

const ASSISTANT_TRAINING_REPLY: Record<Language, string> = {
  en: 'The AI model is currently in training and only responds to a small set of predefined prompts. Try: Hello, Who is Jesus, What is the Bible, Prayer, John 3:16.',
  te: 'AI మోడల్ ప్రస్తుతానికి శిక్షణలో ఉంది మరియు చిన్న సూచనల సెట్‌కు మాత్రమే ప్రతిస్పందిస్తుంది. ప్రయత్నించండి: Hello, Who is Jesus, What is the Bible, Prayer, John 3:16.',
};

function getLanguagePrefix(language: Language) {
  return language === 'en' ? 'Please answer in English.' : 'Please answer in Telugu.';
}

export async function getAssistantReply(input: string, history: AssistantMessage[], language: Language = 'te', authToken?: string): Promise<string> {
  let apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || '';
  if (Platform.OS === 'android' && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'))) {
    apiUrl = apiUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  const useLocalStub = (process.env.EXPO_LOCAL_AI_STUB || process.env.USE_LOCAL_AI_STUB) === 'true';
  const generativePrompt = `${getLanguagePrefix(language)}\nPlease answer the question directly and concisely in ${language === 'en' ? 'English' : 'Telugu'}. Do not only return Bible passages — explain the idea first, and include citations only if explicitly requested.\n\n${input}`;

  // Handle exact predefined prompts locally first so language selection is respected.
  const directLocalResponse = getLocalAssistantResponse(input, language);
  if (directLocalResponse) return directLocalResponse;

  if (useLocalStub) {
    const local = await getLocalAssistantFallback(input, language);
    if (local) return local;
    return ASSISTANT_TRAINING_REPLY[language];
  }

  // Prefer proxy server first (avoids exposing API key and bypasses CORS)
  if (apiUrl) {
    try {
      const proxyEndpoint = `${apiUrl.replace(/\/+$/, '')}/api/ai`;
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const resp = await fetch(proxyEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ input: generativePrompt, history, language }),
      });
      
      if (resp.ok) {
        const body = await resp.json().catch(() => null);
        if (body?.text) return body.text;
        if (body?.answer) return body.answer;
      } else if (resp.status === 401) {
        throw new Error(language === 'en' 
          ? 'Unauthorized. Please sign in to use the AI assistant.' 
          : 'అనుమతి లేనిది. AI సహాయకుడిని ఉపయోగించడానికి దయచేసి సైన్ ఇన్ చేయండి.');
      } else if (resp.status === 429) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error || (language === 'en'
          ? 'AI quota exceeded. Please try again later (quota resets daily).'
          : 'AI కోటా ఖాళీ అయిపోయింది. దయచేసి తర్వాత ప్రయత్నించండి (రోజువారీ కోటా రీసెట్)'));
      } else {
        const body = await resp.json().catch(() => null);
        const errMsg = body?.error || `Server error ${resp.status}`;
        console.warn('Proxy /api/ai error', resp.status, errMsg);
        throw new Error(errMsg);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Proxy call error', message);
      // Re-throw auth and quota errors to be handled by the UI
      if (message.includes('Unauthorized') || message.includes('quota') || message.includes('అనుమతి')) {
        throw err;
      }
      // For other errors, fall through to local fallback
    }
  }

  // If proxy failed, fall back to local assistant responses.
  const local = await getLocalAssistantFallback(input, language);
  if (local) return local;

  return ASSISTANT_TRAINING_REPLY[language];
}
