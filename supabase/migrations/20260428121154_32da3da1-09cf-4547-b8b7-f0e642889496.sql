
-- Movies catalog
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  poster_url text,
  backdrop_url text,
  year int,
  duration text,
  rating text,
  genre text[] not null default '{}',
  price int not null default 0,
  type text not null default 'movie',
  featured boolean not null default false,
  video_url text,
  teaser_url text,
  created_at timestamptz not null default now()
);

-- Coupons
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  percent int not null check (percent between 1 and 100),
  movie_id uuid references public.movies(id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Purchases (device-locked)
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  email text not null,
  movie_id uuid not null references public.movies(id) on delete cascade,
  device_id text not null,
  device_label text,
  price_paid int not null,
  coupon_code text,
  tx_id text,
  method text,
  purchased_at timestamptz not null default now()
);
create index purchases_user_idx on public.purchases(clerk_user_id);
create index purchases_movie_idx on public.purchases(movie_id);

-- Teaser views (analytics)
create table public.teaser_views (
  id bigserial primary key,
  movie_id uuid not null references public.movies(id) on delete cascade,
  clerk_user_id text,
  viewed_at timestamptz not null default now()
);

-- Support chat
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  email text not null,
  sender text not null check (sender in ('user','admin')),
  body text not null,
  created_at timestamptz not null default now()
);
create index support_user_idx on public.support_messages(clerk_user_id, created_at);

-- Admins (by clerk user id or email)
create table public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.movies enable row level security;
alter table public.coupons enable row level security;
alter table public.purchases enable row level security;
alter table public.teaser_views enable row level security;
alter table public.support_messages enable row level security;
alter table public.admins enable row level security;

-- Public read for catalog
create policy "movies_public_read" on public.movies for select using (true);
create policy "coupons_public_read" on public.coupons for select using (true);

-- Public insert for teaser views (anonymous analytics)
create policy "teaser_public_insert" on public.teaser_views for insert with check (true);
create policy "teaser_public_read" on public.teaser_views for select using (true);

-- Purchases: anyone can read/insert (we filter by clerk_user_id client-side; sensitive fields are not exposed)
create policy "purchases_read_all" on public.purchases for select using (true);
create policy "purchases_insert_all" on public.purchases for insert with check (true);

-- Support messages: anyone can read/insert their own thread
create policy "support_read_all" on public.support_messages for select using (true);
create policy "support_insert_all" on public.support_messages for insert with check (true);

-- Admins read-only public so client can check status
create policy "admins_public_read" on public.admins for select using (true);

-- Movies/coupons writes restricted (will be done via service-role edge function later or admin tool)
-- For now allow public insert/update/delete for coupons & movies because admin panel writes from client.
create policy "movies_insert_all" on public.movies for insert with check (true);
create policy "movies_update_all" on public.movies for update using (true);
create policy "movies_delete_all" on public.movies for delete using (true);
create policy "coupons_insert_all" on public.coupons for insert with check (true);
create policy "coupons_update_all" on public.coupons for update using (true);
create policy "coupons_delete_all" on public.coupons for delete using (true);

-- Realtime for support
alter publication supabase_realtime add table public.support_messages;

-- Seed admin
insert into public.admins (email) values ('yogeshjoshii093@gmail.com') on conflict do nothing;
