-- supabase/migrations/20260519000001_app_mode_and_chat.sql
-- Adds: app_mode column on profiles, conversations + messages tables, RLS policies.

-- ============================================================
-- profiles.app_mode
-- ============================================================
alter table public.profiles
  add column app_mode text not null default 'mock'
    check (app_mode in ('mock','real'));

-- ============================================================
-- conversations
-- ============================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_conversations_profile_updated
  on public.conversations(profile_id, updated_at desc);

-- ============================================================
-- messages
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','captain')),
  text text not null,
  brief_json jsonb,
  created_at timestamptz default now()
);

create index idx_messages_conversation
  on public.messages(conversation_id, created_at);

-- ============================================================
-- RLS
-- ============================================================
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

create policy "users select own conversations"
  on public.conversations for select
  using (profile_id = auth.uid());

create policy "users insert own conversations"
  on public.conversations for insert
  with check (profile_id = auth.uid());

create policy "users update own conversations"
  on public.conversations for update
  using (profile_id = auth.uid());

create policy "users delete own conversations"
  on public.conversations for delete
  using (profile_id = auth.uid());

create policy "users select own messages"
  on public.messages for select
  using (exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.profile_id = auth.uid()
  ));

create policy "users insert own messages"
  on public.messages for insert
  with check (exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.profile_id = auth.uid()
  ));

create policy "users delete own messages"
  on public.messages for delete
  using (exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.profile_id = auth.uid()
  ));
