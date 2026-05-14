-- supabase/migrations/20260514000001_initial_schema.sql

create extension if not exists "pgcrypto";

-- ============================================================
-- Profiles (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  preferred_language text default 'tr' check (preferred_language in ('tr','en')),
  shopify_store_url text,
  shopify_access_token text,
  created_at timestamptz default now()
);

-- ============================================================
-- Products
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  external_id text,
  name text not null,
  description text,
  current_price numeric(10,2),
  cost_basis numeric(10,2),
  category text,
  images jsonb default '[]'::jsonb,
  channels jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create index idx_products_profile on public.products(profile_id);

-- ============================================================
-- Reviews
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  channel text not null,
  language text,
  rating int check (rating between 1 and 5),
  body text not null,
  sentiment_score numeric(3,2),
  themes jsonb default '[]'::jsonb,
  reply_draft text,
  posted_at timestamptz,
  created_at timestamptz default now()
);

create index idx_reviews_product on public.reviews(product_id);

-- ============================================================
-- Sales
-- ============================================================
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id),
  channel text not null,
  quantity int not null,
  unit_price numeric(10,2) not null,
  total_revenue numeric(10,2) not null,
  occurred_at timestamptz not null
);

create index idx_sales_profile_date on public.sales(profile_id, occurred_at);

-- ============================================================
-- Expenses
-- ============================================================
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  category text,
  due_at timestamptz not null,
  paid boolean default false
);

create index idx_expenses_profile_due on public.expenses(profile_id, due_at);

-- ============================================================
-- Agent traces
-- ============================================================
create table public.agent_traces (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  query text not null,
  trace_json jsonb not null,
  duration_ms int,
  total_tokens int,
  cost_estimate numeric(10,4),
  created_at timestamptz default now()
);

create index idx_traces_profile_date on public.agent_traces(profile_id, created_at);

-- ============================================================
-- Trigger: create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, business_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'business_name', 'KOBİ Sahibi'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
