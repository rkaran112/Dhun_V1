-- Dhun initial schema.
--
-- Defines every table the app queries (profiles, logs, follows, ranked_lists,
-- ranked_list_items) plus the row level security policies the browser client
-- relies on. Run it once against a fresh Supabase project, either by pasting
-- it into the SQL editor or with `supabase db push`.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, upserted on sign-in (app/page.tsx).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- logs: an album a user has logged, with rating, review and shelves.
-- Constraints mirror lib/validation/logs.ts.
-- ---------------------------------------------------------------------------
create table public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  album_id text not null,
  album_name text not null,
  artist_name text not null,
  cover_url text,
  rating numeric(2, 1) not null
    check (rating >= 0.5 and rating <= 5 and rating * 2 = floor(rating * 2)),
  shelves text[] not null default '{}'
    check (
      cardinality(shelves) >= 1
      and shelves <@ array['listened', 'want to listen']::text[]
    ),
  review_text text not null default ''
    check (char_length(review_text) <= 2000),
  genre text,
  created_at timestamptz not null default now()
);

-- Per-user views (logbook, archives, diagnostics, profile) and the global feed.
create index logs_user_id_created_at_idx
  on public.logs (user_id, created_at desc);
create index logs_created_at_idx
  on public.logs (created_at desc);

alter table public.logs enable row level security;

-- Logs are public: the mainframe feed, profile pages and /log/[id] show
-- other users' logs.
create policy "Logs are readable by everyone"
  on public.logs for select
  using (true);

create policy "Users can create their own logs"
  on public.logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own logs"
  on public.logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own logs"
  on public.logs for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- follows: who follows whom, used by the "following" mainframe feed.
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followed_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

alter table public.follows enable row level security;

create policy "Follows are readable by everyone"
  on public.follows for select
  using (true);

create policy "Users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow as themselves"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
-- ranked_lists / ranked_list_items: drag-and-drop ranked lists (archives).
-- ---------------------------------------------------------------------------
create table public.ranked_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) > 0),
  description text,
  created_at timestamptz not null default now()
);

create index ranked_lists_user_id_created_at_idx
  on public.ranked_lists (user_id, created_at desc);

alter table public.ranked_lists enable row level security;

create policy "Users can read their own ranked lists"
  on public.ranked_lists for select
  using (auth.uid() = user_id);

create policy "Users can create their own ranked lists"
  on public.ranked_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own ranked lists"
  on public.ranked_lists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own ranked lists"
  on public.ranked_lists for delete
  using (auth.uid() = user_id);

-- rank is deliberately not unique per list: reordering rewrites ranks one row
-- at a time, so two rows briefly share a rank mid-reorder.
create table public.ranked_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.ranked_lists (id) on delete cascade,
  album_id text not null,
  album_name text not null,
  artist_name text not null,
  cover_url text,
  rank integer not null check (rank >= 1),
  created_at timestamptz not null default now()
);

create index ranked_list_items_list_id_rank_idx
  on public.ranked_list_items (list_id, rank);

alter table public.ranked_list_items enable row level security;

-- Items carry no user_id; ownership is inherited from the parent list.
create policy "Users can read items in their own ranked lists"
  on public.ranked_list_items for select
  using (
    exists (
      select 1 from public.ranked_lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  );

create policy "Users can add items to their own ranked lists"
  on public.ranked_list_items for insert
  with check (
    exists (
      select 1 from public.ranked_lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  );

create policy "Users can update items in their own ranked lists"
  on public.ranked_list_items for update
  using (
    exists (
      select 1 from public.ranked_lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ranked_lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  );

create policy "Users can delete items from their own ranked lists"
  on public.ranked_list_items for delete
  using (
    exists (
      select 1 from public.ranked_lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  );
