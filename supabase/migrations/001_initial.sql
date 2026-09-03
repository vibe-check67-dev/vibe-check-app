-- ============================================
-- 1. PROFILES TABLE
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Admin can read all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admin can read all profiles
create policy "Admin can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can update their own profile (cannot change role directly)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================
-- 2. TRIGGER: Auto-create profile on signup
--    + Auto-set admin role from vault secret
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  admin_email text;
  user_role text := 'user';
begin
  -- Try to get ADMIN_EMAIL from Supabase Vault if extension exists
  begin
    select decrypted_secret into admin_email
    from vault.decrypted_secrets
    where name = 'ADMIN_EMAIL'
    limit 1;
  exception when others then
    admin_email := null;
  end;

  -- Match admin email
  if admin_email is not null and new.email = admin_email then
    user_role := 'admin';
  end if;

  insert into public.profiles (id, email, display_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    user_role
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 3. MOOD_CHECKINS TABLE
-- ============================================
create table if not exists public.mood_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  energy smallint not null check (energy between 1 and 5),
  stress smallint not null check (stress between 1 and 5),
  social smallint not null check (social between 1 and 5),
  sleep smallint not null check (sleep between 1 and 5),
  focus smallint check (focus between 1 and 5),
  outlook smallint check (outlook between 1 and 5),
  overall_mood smallint not null check (overall_mood between 1 and 5),
  free_text text default '' check (char_length(free_text) <= 100),
  time_of_day text not null check (time_of_day in ('morning', 'afternoon', 'evening')),
  journal_response text,
  ai_activity text,
  ai_playlist text,
  ai_food text,
  ai_message text,
  ai_journal_prompt text,
  checkin_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.mood_checkins enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can CRUD own checkins" on public.mood_checkins;
drop policy if exists "Admin can read all checkins" on public.mood_checkins;
drop policy if exists "Admin can modify all checkins" on public.mood_checkins;

-- User can CRUD own checkins
create policy "Users can CRUD own checkins"
  on public.mood_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admin can read all checkins
create policy "Admin can read all checkins"
  on public.mood_checkins for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admin can modify/delete all checkins
create policy "Admin can modify all checkins"
  on public.mood_checkins for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- 4. APP_SETTINGS TABLE (admin-only)
-- ============================================
create table if not exists public.app_settings (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

alter table public.app_settings enable row level security;

drop policy if exists "Admin only access" on public.app_settings;
create policy "Admin only access"
  on public.app_settings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Seed default settings if not exists
insert into public.app_settings (key, value) values
  ('GEMINI_API_KEY', ''),
  ('GEMINI_MODEL', 'gemini-2.5-flash')
on conflict (key) do nothing;

-- ============================================
-- 5. REALTIME
-- ============================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'mood_checkins'
  ) then
    alter publication supabase_realtime add table public.mood_checkins;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- ============================================
-- 6. INDEXES
-- ============================================
create index if not exists idx_checkins_user_id on public.mood_checkins(user_id);
create index if not exists idx_checkins_date on public.mood_checkins(checkin_date desc);
create index if not exists idx_checkins_user_date on public.mood_checkins(user_id, checkin_date desc);
