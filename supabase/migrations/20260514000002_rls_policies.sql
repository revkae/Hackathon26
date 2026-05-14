-- supabase/migrations/20260514000002_rls_policies.sql

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;
alter table public.agent_traces enable row level security;

-- Profiles: users see/edit only their own
create policy "users select own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Products: users access only their own
create policy "users select own products"
  on public.products for select
  using (profile_id = auth.uid());

create policy "users insert own products"
  on public.products for insert
  with check (profile_id = auth.uid());

create policy "users update own products"
  on public.products for update
  using (profile_id = auth.uid());

create policy "users delete own products"
  on public.products for delete
  using (profile_id = auth.uid());

-- Reviews: through product ownership
create policy "users select own reviews"
  on public.reviews for select
  using (exists (
    select 1 from public.products
    where products.id = reviews.product_id
      and products.profile_id = auth.uid()
  ));

create policy "users update own reviews"
  on public.reviews for update
  using (exists (
    select 1 from public.products
    where products.id = reviews.product_id
      and products.profile_id = auth.uid()
  ));

-- Sales: by profile_id
create policy "users select own sales"
  on public.sales for select
  using (profile_id = auth.uid());

-- Expenses: by profile_id
create policy "users access own expenses"
  on public.expenses for all
  using (profile_id = auth.uid());

-- Traces: by profile_id
create policy "users select own traces"
  on public.agent_traces for select
  using (profile_id = auth.uid());

create policy "users insert own traces"
  on public.agent_traces for insert
  with check (profile_id = auth.uid());
