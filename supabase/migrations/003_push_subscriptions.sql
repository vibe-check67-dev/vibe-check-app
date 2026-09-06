-- ============================================
-- 003_push_subscriptions.sql
-- Table to store Web Push subscriptions for mobile notifications
-- ============================================

create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can manage own push subscriptions" on public.push_subscriptions;
drop policy if exists "Service role can read all subscriptions" on public.push_subscriptions;

-- Users can read, insert, and delete their own subscriptions
create policy "Users can manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
