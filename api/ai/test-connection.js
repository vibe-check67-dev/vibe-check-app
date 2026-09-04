import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { apiKey, model = 'gemini-3.0-flash' } = req.body || {};

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required for testing' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: model || 'gemini-3.0-flash',
      contents: 'Hello! Respond with {"status": "ok", "message": "Gemini connection successful"}',
      config: {
        responseMimeType: 'application/json',
      },
    });

    return res.status(200).json({
      success: true,
      result: response.text || 'Connected successfully',
    });
  } catch (err) {
    console.error('Test connection error:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to connect to Gemini API',
    });
  }
}
