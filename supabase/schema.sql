-- ============================================================
-- Cultura App — Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. PROFILES (extiende auth.users de Supabase)
create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  username     text unique not null,
  display_name text not null,
  bio          text check (char_length(bio) <= 150),
  avatar_url   text,
  is_private   boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 2. CONTENT (caché de películas, libros, series, música)
create table if not exists public.content (
  id          uuid default gen_random_uuid() primary key,
  type        text not null check (type in ('MOVIE','BOOK','SERIES','MUSIC_ARTIST','MUSIC_ALBUM','MUSIC_TRACK')),
  external_id text not null,
  title       text not null,
  subtitle    text,
  creator     text,
  year        int,
  genre       text,
  cover_url   text,
  synopsis    text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (type, external_id)
);

-- 3. USER_CONTENT
create table if not exists public.user_content (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  content_id        uuid references public.content(id) not null,
  content_type      text not null,
  status            text not null,
  rating            int check (rating >= 1 and rating <= 5),
  review            text check (char_length(review) <= 500),
  is_favorite       boolean default false,
  progress_value    int,
  progress_total    int,
  date_started      date,
  date_finished     date,
  recommended_by_id uuid references public.profiles(id),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique (user_id, content_id)
);

-- 4. RECOMMENDATIONS
create table if not exists public.recommendations (
  id              uuid default gen_random_uuid() primary key,
  sender_id       uuid references public.profiles(id) on delete cascade not null,
  receiver_id     uuid references public.profiles(id) on delete cascade not null,
  content_id      uuid references public.content(id) not null,
  message         text check (char_length(message) <= 200),
  status          text default 'PENDING' check (status in ('PENDING','SAVED','ACKNOWLEDGED','IGNORED')),
  acknowledged_at timestamptz,
  created_at      timestamptz default now()
);

-- 5. NOTIFICATIONS
create table if not exists public.notifications (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  type       text not null check (type in ('RECOMMENDATION_RECEIVED','RECOMMENDATION_FOLLOWED')),
  data       jsonb not null default '{}',
  read       boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.content          enable row level security;
alter table public.user_content     enable row level security;
alter table public.recommendations  enable row level security;
alter table public.notifications    enable row level security;

create policy "Profiles public read"    on public.profiles for select using (true);
create policy "Profiles own update"     on public.profiles for update using (auth.uid() = id);
create policy "Profiles own insert"     on public.profiles for insert with check (auth.uid() = id);
create policy "Content public read"     on public.content  for select using (true);
create policy "UserContent own"         on public.user_content for all using (auth.uid() = user_id);
create policy "Recommendations visible" on public.recommendations for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Recommendations send"    on public.recommendations for insert with check (auth.uid() = sender_id);
create policy "Recommendations update"  on public.recommendations for update using (auth.uid() = receiver_id);
create policy "Notifications own"       on public.notifications for all using (auth.uid() = user_id);

-- ============================================================
-- Trigger: crear perfil al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'display_name', 'Usuario')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
