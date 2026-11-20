-- Dhun initial schema.
-- Derived from the queries in app/ and components/. Apply with
-- `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, upserted on sign-in (app/page.tsx)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- logs: a user's rating/review of an album, tagged with one or more shelves
-- ---------------------------------------------------------------------------
create table if not exists public.logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  album_id     text not null,
  album_name   text not null,
  artist_name  text not null,
  cover_url    text,
  rating       numeric(2, 1)
                 check (rating is null or (rating between 0.5 and 5 and rating * 2 = floor(rating * 2))),
  shelves      text[] not null default '{}'
                 check (shelves <@ array['listened', 'want to listen']::text[]),
  review_text  text not null default '' check (char_length(review_text) <= 2000),
  genre        text,
  created_at   timestamptz not null default now()
);

create index if not exists logs_user_created_idx on public.logs (user_id, created_at desc);
create index if not exists logs_created_idx on public.logs (created_at desc);
create index if not exists logs_shelves_idx on public.logs using gin (shelves);

-- ---------------------------------------------------------------------------
-- follows: follower -> followed, used by the "following" Mainframe feed
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references auth.users (id) on delete cascade,
  followed_id  uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create index if not exists follows_followed_idx on public.follows (followed_id);

-- ---------------------------------------------------------------------------
-- ranked_lists / ranked_list_items: drag-and-drop lists on /archives
-- ---------------------------------------------------------------------------
create table if not exists public.ranked_lists (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) > 0),
  description  text,
  created_at   timestamptz not null default now()
);

create index if not exists ranked_lists_user_created_idx on public.ranked_lists (user_id, created_at desc);

create table if not exists public.ranked_list_items (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null references public.ranked_lists (id) on delete cascade,
  album_id     text not null,
  album_name   text not null,
  artist_name  text not null,
  cover_url    text,
  rank         integer not null check (rank > 0),
  created_at   timestamptz not null default now()
);

-- Not unique on (list_id, rank): reordering updates ranks one row at a time.
create index if not exists ranked_list_items_list_rank_idx on public.ranked_list_items (list_id, rank);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.logs              enable row level security;
alter table public.follows           enable row level security;
alter table public.ranked_lists      enable row level security;
alter table public.ranked_list_items enable row level security;

-- Profiles and logs are public (profile pages, Mainframe feed, /log/[id]).
create policy "profiles are public" on public.profiles
  for select using (true);
create policy "users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "logs are public" on public.logs
  for select using (true);
create policy "users insert own logs" on public.logs
  for insert with check (auth.uid() = user_id);
create policy "users update own logs" on public.logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own logs" on public.logs
  for delete using (auth.uid() = user_id);

create policy "follows are public" on public.follows
  for select using (true);
create policy "users follow as themselves" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "users unfollow as themselves" on public.follows
  for delete using (auth.uid() = follower_id);

create policy "users manage own ranked lists" on public.ranked_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage items in own ranked lists" on public.ranked_list_items
  for all
  using (exists (
    select 1 from public.ranked_lists l
    where l.id = ranked_list_items.list_id and l.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.ranked_lists l
    where l.id = ranked_list_items.list_id and l.user_id = auth.uid()
  ));
