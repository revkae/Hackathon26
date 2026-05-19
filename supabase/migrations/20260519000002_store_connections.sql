-- supabase/migrations/20260519000002_store_connections.sql
-- Per-user marketplace connections (domain + access token), one row per platform.

create table public.store_connections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('shopify','trendyol','hepsiburada','etsy')),
  domain text not null,
  access_token text not null,
  store_name text not null,
  created_at timestamptz default now(),
  unique (profile_id, platform)
);

alter table public.store_connections enable row level security;

create policy "users select own store_connections"
  on public.store_connections for select
  using (profile_id = auth.uid());

create policy "users insert own store_connections"
  on public.store_connections for insert
  with check (profile_id = auth.uid());

create policy "users update own store_connections"
  on public.store_connections for update
  using (profile_id = auth.uid());

create policy "users delete own store_connections"
  on public.store_connections for delete
  using (profile_id = auth.uid());
