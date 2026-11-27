-- Dhun initial schema (inferred from application queries).
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  album_id text not null,
  album_name text not null,
  artist_name text not null,
  cover_url text,
  genre text,
  rating numeric(2,1) not null check (rating >= 0.5 and rating <= 5 and (rating * 2) = floor(rating * 2)),
  shelves text[] not null default '{}',
  review_text text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists logs_user_created_idx on public.logs (user_id, created_at desc);
create index if not exists logs_created_idx on public.logs (created_at desc);

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id)
);

create table if not exists public.ranked_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.ranked_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.ranked_lists(id) on delete cascade,
  album_id text not null,
  album_name text not null,
  artist_name text not null,
  cover_url text,
  rank integer not null
);
create index if not exists ranked_list_items_list_rank_idx on public.ranked_list_items (list_id, rank);

alter table public.profiles enable row level security;
alter table public.logs enable row level security;
alter table public.follows enable row level security;
alter table public.ranked_lists enable row level security;
alter table public.ranked_list_items enable row level security;

create policy "profiles readable" on public.profiles for select using (true);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

create policy "logs readable" on public.logs for select using (true);
create policy "logs insert own" on public.logs for insert with check (auth.uid() = user_id);
create policy "logs update own" on public.logs for update using (auth.uid() = user_id);
create policy "logs delete own" on public.logs for delete using (auth.uid() = user_id);

create policy "follows readable" on public.follows for select using (true);
create policy "follows insert own" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows delete own" on public.follows for delete using (auth.uid() = follower_id);

create policy "lists readable" on public.ranked_lists for select using (true);
create policy "lists write own" on public.ranked_lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "list items readable" on public.ranked_list_items for select using (true);
create policy "list items write own" on public.ranked_list_items for all
  using (exists (select 1 from public.ranked_lists l where l.id = list_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.ranked_lists l where l.id = list_id and l.user_id = auth.uid()));
