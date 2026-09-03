# 〰️ Vibe Check

> **Your daily 60-second mood check-in with AI-powered wellness suggestions, interactive trends, and a full-featured real-time Admin Panel.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green.svg)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-blue.svg)](https://aistudio.google.com)

---

## ✨ Features

- **⚡ 60-Second Daily Check-in**: Track Energy, Stress, Social Mood, Sleep Quality, Focus, Outlook, and Notes with smooth interactive emojis.
- **🤖 AI Wellness Coach (Google Gemini)**: Real-time, glanceable recommendations for activities, music playlists, comfort food & drinks, and warm encouraging messages.
- **📊 Interactive Analytics & Trends**: Weekly mood graphs, monthly heatmaps, breakdown charts, and streak tracking.
- **🛡️ Real-time Admin Dashboard**:
  - **Executive Analytics**: 5 Core KPI summary cards, interactive trend lines, score distribution, and time-of-day ratios.
  - **User Management**: View all registered users, filter records by user, and drill down into individual history.
  - **Data Management (CRUD + CSV)**: Search, add, edit, or delete check-in entries with instant **Supabase Realtime** synchronization.
  - **CSV Import & Export**: One-click export and bulk import with UTF-8 BOM encoding for complete Thai character support.
  - **AI Configuration**: In-app Gemini API key management, model selector (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-3.7-flash`), and instant connection test.
- **🎨 Shareable Mood Cards**: Generate and share high-resolution mood cards powered by native Canvas API.
- **🌐 Bilingual (TH / EN)**: Seamless Thai & English localization with automatic browser language detection and localStorage memory.
- **🔐 Secure Authentication**: Supabase Auth supporting Email/Password and Google OAuth with Row-Level Security (RLS).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS, Lucide Icons, Framer Motion, Recharts, Radix UI (shadcn/ui)
- **Backend & Database**: Supabase (PostgreSQL, Realtime, Row Level Security, Auth)
- **Serverless API**: Vercel Serverless Functions (`/api/ai/recommend`, `/api/ai/test-connection`)
- **AI Model**: Google Gemini API via `@google/genai` SDK
- **Deployment**: Vercel

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Supabase](https://supabase.com/) project (Free tier works great)
- A [Google AI Studio](https://aistudio.google.com/) API Key (Free tier available)

---

### 2. Supabase Database Setup

1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Open `supabase/migrations/001_initial.sql` from this repository.
3. Paste and run the script. This will create:
   - `profiles` table with automatic user registration triggers
   - `mood_checkins` table with Row-Level Security (RLS)
   - `app_settings` table for storing Gemini API credentials securely
   - Realtime publication on `mood_checkins` and `profiles`

4. *(Optional)* To automatically make your email an Admin on signup, run in the SQL editor:
   ```sql
   SELECT vault.create_secret('your-email@gmail.com', 'ADMIN_EMAIL');
   ```
   Or manually promote an existing user:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@gmail.com';
   ```

5. *(Optional)* Enable **Google OAuth** in **Authentication** -> **Providers** if you wish to allow Google sign-in.

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
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

4. **Start local dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 4. Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. In **Project Settings** -> **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. Vercel will automatically configure the Vite build and `/api` Serverless Functions!

---

## 🔒 Security & Architecture

- **Client Safety**: The Gemini API key and Supabase Service Role Key are **never exposed** to the browser.
- **Serverless Proxy**: AI recommendations are requested via `/api/ai/recommend`, where the server securely reads the API key directly from Supabase `app_settings` using RLS and in-memory caching.
- **Row-Level Security (RLS)**: Regular users can only read and mutate their own check-ins. Only users with `role = 'admin'` in `public.profiles` can access all check-ins or modify system settings.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
