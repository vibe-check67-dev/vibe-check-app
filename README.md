# 〰️ Vibe Check

> **Your daily 60-second mood check-in with AI-powered wellness suggestions, multi-timeframe analytics, streak tracking, and a full-featured real-time Admin Panel.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green.svg)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-blue.svg)](https://aistudio.google.com)

---

## ✨ Key Features

### ⚡ 1. Fast & Flexible Check-ins
- **60-Second In-Depth Check-in**: Track 6 core wellness dimensions using smooth, animated emoji sliders:
  - ⚡ Energy Level (หมดแรง 🪫 ↔ เต็มเปี่ยม 🔥)
  - 😰 Stress Level (สงบ 😌 ↔ ท่วมท้น 🤯)
  - 💬 Social Mood (อยู่คนเดียว 🧘 ↔ สังคม 🦋)
  - 🌙 Sleep Quality (แย่มาก 😵 ↔ ยอดเยี่ยม 🌟)
  - 🎯 Focus & Sharpness (ล่องลอย 🌫️ ↔ คมกริบ 🔥)
  - ✨ Outlook on Tomorrow (กังวล ☁️ ↔ ตื่นเต้น 🌟)
  - 📝 Optional Note / Journal prompt
- **🚀 Quick Check-in**: One-tap quick check-in directly on the Home page (แย่ 😔, พอใช้ 😐, ดี 🙂, ดีมาก 😄) with automatic baseline calculation.
- **🔄 Multi Check-in Support**: Check in multiple times a day to capture your shifting emotions from morning to night.

---

### 🤖 2. Dynamic AI Wellness Coach (Google Gemini)
- **High Variety & Anti-Repetition Engine**: Elevated creativity temperature with session nonces to ensure unique, non-repetitive advice even across identical mood inputs.
- **Curated Multi-Genre Playlists**: Rotates across diverse music vibes (Neo-Soul, City Pop, Indie Folk, Bossa Nova, Synthwave, Deep House, Thai Indie, Jazz, Classical, etc.) rather than repeating generic lo-fi beats.
- **Profile-Aware Personalization**: Respects personal user health profiles:
  - Strictly avoids reported **food allergens** and disliked foods.
  - Excludes disliked music genres and physical activities.
  - Factors in physical stats (weight, height, biological sex) and medical conditions.
- **Multi-Model Auto-Fallback**: Automatically falls back through multiple Gemini models (`gemini-3.7-flash`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-2.5-flash`) to ensure zero downtime.
- **Actionable Outputs**:
  - 🏃 Micro-activity & reason (~12 words)
  - 🎵 Playlist vibe & genre recommendation
  - 🍽️ Real comfort food & healthy drink pairing
  - 💌 Uplifting, unscripted personal note
  - 💭 Reflective journal question with sentiment score tracking

---

### 📊 3. Interactive Analytics & Visual Trends
- **🕒 Daily Mood Timeline Chart**: 24-hour hourly curve tracking mood swings throughout the day with daily average score badge (`คะแนนอารมณ์เฉลี่ยวันนี้: X.X / 5 😄`).
- **📈 Mood Trend (Weekly & Custom Range)**: Dual-line trend tracking **Before Reading** vs **After Reading** mood shifts, with daily average badges, emoji Y-axis (`🔥 5` to `😔 1`), and rich tooltips.
- **📅 Monthly Contribution Heatmap**: GitHub-style calendar overview showing daily mood density and scores across the current month.
- **🍩 Mood Breakdown**: Visual distribution of mood categories over time.
- **🔍 Journal Search & Filter**: Instant keyword search through journal responses and notes, filtered by mood score range.
- **🔥 TikTok-Style Fire Streak System**:
  - Active burning flame (`🔥 X วันติดต่อกัน - เติมไฟวันนี้แล้ว!`) when checked in today.
  - Grey unlit flame (`🩶 ยังไม่ได้เติมไฟวันนี้`) as a visual cue to maintain your daily streak.

---

### ⏰ 4. Smart Notifications & Reminders
- **Client-Side Notification Scheduler**: 100% free, device-level Web Push/Notification API reminders without costly third-party cloud push servers.
- **Customizable Reminder Times**: Set personalized check-in times (e.g. 09:00, 14:00, 21:00) with automatic local timezone detection.
- **Afternoon & Missing Check-in Banners**: Gentle, context-aware in-app banners reminding you to fuel your daily streak.

---

### 🛡️ 5. Real-Time Admin Dashboard
- **Executive Analytics**: 5 core KPI summary cards (Avg Mood, Stress, Energy, Sleep, Social), interactive hourly timeline analysis, and timeframe filters.
- **User Directory**: View all registered users, filter records by user, and drill down into individual check-in logs.
- **Full CRUD & Supabase Realtime**: Add, edit, or delete records with instant live WebSocket synchronization.
- **CSV Import & Export**: One-click bulk export and import with **UTF-8 BOM** encoding for complete, uncorrupted Thai language support in Excel.
- **In-App AI Configuration**: Live Gemini API key management, model selector, and one-click connection diagnostics.

---

### 🎨 6. Social Sharing & Localization
- **Shareable Mood Cards**: Generate and download high-resolution canvas cards summarizing your mood, score, and AI quote for Instagram Stories or X.
- **Bilingual Support (TH / EN)**: Full Thai and English localization with automatic browser detection and persistent localStorage memory.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide Icons, Framer Motion, Recharts, Radix UI (shadcn/ui) |
| **Backend & Database** | Supabase (PostgreSQL, Realtime, Row Level Security, Auth) |
| **Serverless API** | Vercel Serverless Functions (`/api/ai/recommend`, `/api/ai/test-connection`) |
| **AI SDK** | Google Gemini API via official `@google/genai` SDK |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
vibe-check-app/
├── api/                       # Vercel Serverless Functions
│   ├── ai/
│   │   ├── recommend.js       # Gemini AI recommendation engine (diversity, fallback, CORS)
│   │   └── test-connection.js # API key diagnostic endpoint
├── public/                    # Static assets & icons
├── src/
│   ├── components/
│   │   ├── admin/             # Executive analytics, user list, table view, settings
│   │   ├── checkin/           # Emoji selector & check-in flow
│   │   ├── history/           # Daily timeline, weekly chart, heatmap, journal search
│   │   ├── home/              # Quick check-in, streak banner, reminders
│   │   ├── onboarding/        # First-time user tour slides
│   │   ├── results/           # AI recommendation cards & canvas mood share card
│   │   └── ui/                # shadcn / Radix UI primitives
│   ├── context/
│   │   └── LanguageContext.jsx # TH/EN translation provider
│   ├── lib/
│   │   ├── AuthContext.jsx    # Supabase authentication & user profile state
│   │   ├── database.js        # Supabase CRUD & AI service caller
│   │   ├── pushNotifications.js # Client-side notification scheduler
│   │   └── supabase.js        # Supabase client initialization
│   ├── pages/                 # Home, Checkin, Results, History, Admin, Settings, Auth
│   └── utils/                 # Time of day, streak calculation, sentiment scoring
├── supabase/
│   └── migrations/            # SQL schema, RLS policies, triggers
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Supabase](https://supabase.com/) project
- A [Google AI Studio](https://aistudio.google.com/) API Key

---

### 2. Database Setup (Supabase)
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the migration script in `supabase/migrations/001_initial.sql`:
   - Sets up `profiles`, `mood_checkins`, and `app_settings` tables.
   - Configures Row-Level Security (RLS) policies.
   - Enables Realtime subscriptions on `mood_checkins` and `profiles`.
3. To assign the Admin role to your account:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

---

### 3. Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/vibe-check-app.git
   cd vibe-check-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

4. **Start Vite Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 4. Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. In **Project Settings** -> **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. Vercel will automatically build the Vite SPA and deploy `/api` serverless functions.

---

## 🔒 Security & Privacy

- **Protected API Credentials**: Google Gemini API keys and Supabase Service Role keys are **never bundled in client code**. They reside securely in serverless function environments and encrypted Supabase tables.
- **Strict Row-Level Security (RLS)**: Users can only read and modify their own check-in logs. Only users verified with `role = 'admin'` in `public.profiles` can access aggregate datasets or modify system settings.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
