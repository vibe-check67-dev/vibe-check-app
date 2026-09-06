import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Simple in-memory cache for API settings across serverless warm invocations
let cachedConfig = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getGeminiConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  let supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  let apiKey = process.env.GEMINI_API_KEY || '';
  let model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

  // If Supabase service credentials are provided, fetch latest settings from app_settings
  if (supabaseUrl && serviceKey) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      });

      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .select('key, value')
        .in('key', ['GEMINI_API_KEY', 'GEMINI_MODEL']);

      if (!error && data) {
        const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
        if (map.GEMINI_API_KEY) apiKey = map.GEMINI_API_KEY;
        if (map.GEMINI_MODEL) model = map.GEMINI_MODEL;
      }
    } catch (err) {
      console.warn('Could not read settings from Supabase, using env vars:', err);
    }
  }

  cachedConfig = { apiKey, model };
  cacheTimestamp = now;
  return cachedConfig;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { checkin, profile, lang = 'en' } = req.body || {};

    if (!checkin) {
      return res.status(400).json({ error: 'Missing checkin data in request body' });
    }

    const { apiKey, model } = await getGeminiConfig();

    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please set it in Admin Panel or environment variables.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const langLabel = lang === 'th' ? 'Thai' : 'English';
    const presence = (v) => (v && v > 0 ? `${v}/5` : 'not provided');

    const creativityInstruction =
      'Your response must feel warm, personal, and creative — never generic or robotic. Vary your sentence structure, tone, and word choice. Avoid repeating the same phrases across sessions. Write as if a close friend is speaking — casual, genuine, and specific to what the user is experiencing right now.';

    const profileContext = profile ? `
User Personal Profile (Use this to customize your recommendations, respect medical restrictions and allergies strictly):
- Physical info: ${[profile.weight && `Weight: ${profile.weight}kg`, profile.height && `Height: ${profile.height}cm`, profile.biological_sex && `Biological sex: ${profile.biological_sex}`].filter(Boolean).join(', ') || 'Not specified'}
- Medical/Diseases: ${profile.diseases || 'None reported'}
- Food Allergies: ${profile.food_allergies || 'None'} (STRICT REQUIREMENT: DO NOT suggest any food containing these allergens!)
- Disliked Foods: ${profile.dislikes_food || 'None'} (DO NOT recommend these foods)
- Disliked Music: ${profile.dislikes_music || 'None'} (DO NOT recommend this style of music)
- Disliked Activities: ${profile.dislikes_activities || 'None'} (DO NOT recommend these activities)` : '';

    const prompt = `You are a wellness coach for a 60-second mood check-in. A user just checked in:
- Energy: ${checkin.energy || 3}/5
- Stress: ${checkin.stress || 3}/5
- Social mood: ${checkin.social || 3}/5
- Sleep quality: ${checkin.sleep || 3}/5
- Focus: ${presence(checkin.focus)}
- Outlook on tomorrow: ${presence(checkin.outlook)}
- Time of day: ${checkin.time_of_day || 'morning'}
- Note: "${checkin.free_text || 'none'}"
${profileContext}

${creativityInstruction}

Respond entirely in ${langLabel}. Return ONLY a valid JSON object with the following schema:
{
  "activity": "One short suggestion + dash reason. ~12 words max. Do NOT include an emoji (the UI card already shows one).",
  "playlist": "One short suggestion + dash reason. ~12 words max.",
  "food": "${lang === 'th' ? 'รูปแบบ:\n🍽️ [อาหาร] — [เหตุผลสั้นมาก]\n🥤 [เครื่องดื่ม] — [เหตุผลสั้นมาก]\nอาหารต้องเป็นจานจริง เครื่องดื่มห้ามชาตลอด แต่ละบรรทัดสั้นมาก (~8 คำ)' : 'Format:\n🍽️ [food] — [very short reason]\n🥤 [drink] — [very short reason]\nFood must be a real dish, drink must not be plain tea. Each line very short (~8 words).'}",
  "message": "One short warm line + dash reason. ~12 words max. NOT a generic motivational quote.",
  "journal_prompt": "One short reflective question specific to their answers. 1 sentence."
}

Ensure the output is clean parseable JSON without markdown wrapping if possible.`;

    const tryModels = [
      model,
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-2.5-flash',
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastError = null;
    let response = null;

    for (const m of tryModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
          if (response?.text) break;
        } catch (e) {
          lastError = e;
          const msg = e.message || '';
          // If high demand (503) or rate limit (429), pause briefly and retry
          if (msg.includes('503') || msg.includes('429') || e.status === 503) {
            await new Promise((r) => setTimeout(r, 750));
          } else {
            break;
          }
        }
      }
      if (response?.text) break;
    }

    if (!response?.text) {
      throw lastError || new Error('No response from AI models');
    }

    let responseText = response.text || '';
    // Strip markdown code block markers if present
    responseText = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

    const parsed = JSON.parse(responseText);

    return res.status(200).json({
      activity: parsed.activity || '',
      playlist: parsed.playlist || '',
      food: parsed.food || '',
      message: parsed.message || '',
      journal_prompt: parsed.journal_prompt || '',
    });
  } catch (err) {
    console.error('Serverless Gemini recommendation error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to process AI recommendations',
    });
  }
}
