// Lightweight lexicon-based sentiment analysis for journal text (Thai + English).
// Returns a score in [-1, 1]: positive text → positive, negative → negative, neutral → 0.
// Used to nudge the "adjusted mood" line on the trend chart — a fast, free,
// deterministic heuristic (no per-render LLM call), kept deliberately small.

const POSITIVE = [
  // Thai
  'สบาย', 'มีความสุข', 'สุข', 'ตื่นเต้น', 'มีหวัง', 'พอใจ', 'ขอบคุณ', 'รัก', 'ยิ้ม',
  'เบาสบาย', 'ผ่อนคลาย', 'สดชื่น', 'มีพลัง', 'สำเร็จ', 'ภูมิใจ', 'อบอุ่น', 'สงบ',
  'ชื่นชม', 'ดีใจ', 'สนุก', 'สุขใจ', 'มั่นใจ', 'ปลื้ม', 'ตืนตื่น', 'ชื่นมื่น', 'อิ่มเอม',
  'เบิกบาน', 'ดี', 'เฮฮา', 'อบอุ่นใจ',
  // English
  'happy', 'good', 'great', 'grateful', 'love', 'calm', 'relaxed', 'peaceful',
  'joyful', 'excited', 'hopeful', 'content', 'proud', 'warm', 'fun', 'nice',
  'wonderful', 'amazing', 'awesome', 'thanks', 'smile', 'energized', 'refreshed',
  'success', 'confident', 'optimistic', 'pleased', 'delighted', 'glad', 'cheerful',
  'satisfied', 'bright',
];

const NEGATIVE = [
  // Thai
  'เศร้า', 'เสียใจ', 'เครียด', 'กังวล', 'หดหู่', 'เหนื่อย', 'หมดแรง', 'ท้อแท้',
  'หงุดหงิด', 'โกรธ', 'รำคาญ', 'อึดอัด', 'กลัว', 'วิตก', 'กดดัน', 'หนักใจ', 'ผิดหวัง',
  'แย่', 'หมดหวัง', 'เบื่อ', 'ไม่สบายใจ', 'มึน', 'งง', 'สับสน', 'หนัก', 'อ่อนเพลีย',
  'วิตกกังวล', 'เซ็ง', 'เจ็บ', 'ปวด', 'หน่วง', 'อู้อี้', 'ไม่ดี',
  // English
  'sad', 'tired', 'stressed', 'anxious', 'worried', 'angry', 'frustrated',
  'annoyed', 'uncomfortable', 'afraid', 'pressured', 'heavy', 'disappointed',
  'bad', 'awful', 'hopeless', 'bored', 'confused', 'overwhelmed', 'exhausted',
  'drained', 'lonely', 'upset', 'miserable', 'down', 'low', 'nervous', 'tense',
  'irritated', 'gloomy', 'depressed',
];

function countOccurrences(haystack, needle) {
  let count = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    count += 1;
    i += needle.length;
  }
  return count;
}

export function sentimentScore(text) {
  if (!text || !text.trim()) return 0;
  const lower = text.toLowerCase();
  let pos = 0;
  let neg = 0;
  for (const w of POSITIVE) pos += countOccurrences(lower, w);
  for (const w of NEGATIVE) neg += countOccurrences(lower, w);
  const total = pos + neg;
  if (total === 0) return 0;
  return Math.max(-1, Math.min(1, (pos - neg) / total));
}