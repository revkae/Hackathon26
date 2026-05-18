# Multi-feature pass — Mode switch, connection help, sign-up centering, Captain streaming & history

**Date:** 2026-05-19
**Status:** Approved (ready for implementation plan)
**Scope:** Seven UX/architecture changes spanning Settings, Landing, Auth, and Captain chat.

---

## 1. Summary

Seven related changes:

1. Add a global **Mock vs Real mode** toggle in Settings, persisted server-side, that gates dashboard pages and switches agent tools between mock and live data sources.
2. Add a reusable **"How to connect" modal** on every connection card (marketplaces + social).
3. Add **Instagram (and placeholder Twitter / Facebook)** social-account connections in Settings, using the same card + form pattern as marketplaces.
4. **Landing chat input** routes the visitor straight to sign-up — no query saved, no toast on login.
5. **Sign-up page** becomes full-bleed centered (no brand aside). Login keeps the two-column shell.
6. **Captain chat** streams per-step progress and surfaces specific error types, so the UI never sits silently on the thinking dots.
7. **Captain chat history** — persistent conversations + messages in Supabase, with an in-page list-rail to switch and continue past chats.

---

## 2. Bundle A — Settings

### 2.1 Global mode flag

A single source of truth, persisted server-side.

**Schema change** (new migration `supabase/migrations/20260519000001_app_mode_and_chat.sql`):

```sql
alter table public.profiles
  add column app_mode text not null default 'mock'
    check (app_mode in ('mock','real'));
```

**Server helper** — `src/lib/app-mode.ts`:

```ts
export type AppMode = 'mock' | 'real';

export async function getAppMode(supabase: SupabaseClient): Promise<AppMode> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'mock';
  const { data } = await supabase
    .from('profiles')
    .select('app_mode')
    .eq('id', user.id)
    .single();
  return (data?.app_mode as AppMode) ?? 'mock';
}
```

**Client provider** — `src/components/AppModeProvider.tsx`. The dashboard layout (`src/app/[locale]/(dashboard)/layout.tsx`) calls `getAppMode` once on the server, passes it into the provider, and components read it via `useAppMode()`. No client-side fetch.

**Mutation** — `src/app/[locale]/(dashboard)/dashboard/settings/actions.ts`:

```ts
'use server';
export async function setAppMode(next: AppMode) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };
  if (next === 'real') {
    // gate: require at least one connection
    // (read from localStorage on the client BEFORE calling this action;
    // the action itself just trusts the client because connections are
    // currently localStorage-only — see §2.3)
  }
  await supabase.from('profiles').update({ app_mode: next }).eq('id', user.id);
  revalidatePath('/', 'layout');
  return { ok: true };
}
```

**Agent read path** — `src/app/api/agent/route.ts` calls `getAppMode(supabase)` before invoking `captainAgent(...)` and passes `mode` into the flow. Tools branch: `listProductsTool` checks the mode and either reads from Supabase seed data (mock) or hits Shopify Admin API (real).

### 2.2 Mode toggle UI

A prominent card at the top of `SettingsClient.tsx`, above the marketplace grid. Mantine `Switch` with two labels (TR / EN). Switching `mock → real` runs a client-side guard: if `Object.keys(conns).length === 0`, show a red Mantine notification and revert the switch. Switching `real → mock` is always allowed.

Visual sketch:

```
┌───────────────────────────────────────────────────────────┐
│  ⚙  Çalışma Modu                                          │
│                                                           │
│      Demo (Mock)   ●──────  Gerçek (Real)                 │
│                                                           │
│      Demo: Ayşe Hanım'ın örnek verisi. Bağlantı gerekmez. │
│      Gerçek: En az bir mağaza bağlı olmalı.               │
└───────────────────────────────────────────────────────────┘
```

### 2.3 Real-mode gating on dashboard pages

Pages that load data check `mode` server-side. If `mode === 'real'` and the required platform is not connected, render a lightweight `<ConnectionRequired platform="shopify" />` card with a CTA to settings instead of the actual widget.

Affected pages (initial pass — extend as needed):
- `dashboard/products` — needs Shopify (or any) connection
- `dashboard/cashflow` — needs Shopify
- `dashboard/reviews` — needs any marketplace
- `dashboard/social` — works without a connection (image generation is independent) but the "post" buttons should reflect connected state

Connections live in `localStorage` today. The gate reads them via the same `useAppMode()` + `useConnections()` hooks (a new `useConnections` hook centralizes the localStorage access).

### 2.4 Instagram + social-account connections

Add a second grid in `SettingsClient.tsx` titled **Sosyal Hesaplar** / **Social Accounts**, rendered below the marketplace grid. Same `marketplace-card` styling.

**Cards in this grid (v1):**

| Platform | Status | Fields |
|---|---|---|
| Instagram | active | Handle (`@…`), long-lived access token, display name |
| Twitter / X | "Soon" — card disabled | — |
| Facebook | "Soon" — card disabled | — |

Storage: same `localStorage` map as marketplaces but under a separate key `kobi-kaptani.socials`. Type:

```ts
type SocialPlatform = 'instagram' | 'twitter' | 'facebook';
interface SocialConnection {
  handle: string;
  token: string;
  displayName: string;
  connectedAt: string;
}
type SocialConnectionMap = Partial<Record<SocialPlatform, SocialConnection>>;
```

Effect on `SocialClient.tsx`: when Instagram is connected, the `fakePost('Instagram')` notification swaps its message to *"Would post to @yourhandle (real posting ships next)"*. No actual API call yet — keeps the demo working and proves the wiring.

### 2.5 "How to connect" modal

One reusable component, one content registry.

**Component** — `src/components/ConnectHelpModal.tsx`:

```ts
interface ConnectHelpModalProps {
  platform: 'shopify' | 'trendyol' | 'hepsiburada' | 'etsy' | 'instagram';
  opened: boolean;
  onClose: () => void;
  locale: 'tr' | 'en';
}
```

Renders a Mantine `<Modal>` (size `lg`, centered) with: platform icon + name header, numbered steps, screenshots, an "Open admin" external-link button, and a "Copy" button for any code/URL the user must paste back into our app.

**Content registry** — `src/lib/connect-guides/`:

```
src/lib/connect-guides/
├── index.ts             # export GUIDES record
├── shopify.tsx          # JSX content for Shopify
├── trendyol.tsx
├── hepsiburada.tsx
├── etsy.tsx
└── instagram.tsx
```

Each guide module exports:

```ts
export const guide: ConnectGuide = {
  title: { tr: '...', en: '...' },
  steps: [
    { tr: '...', en: '...', screenshot: '/connect-guides/shopify-1.png' },
    ...
  ],
  adminUrl: 'https://admin.shopify.com',
  copySnippet: 'kobi-kaptani', // optional
};
```

Screenshots live under `public/connect-guides/<platform>-<n>.png`. Implementation phase will create placeholder images; the user can swap real ones in later.

**Button placement:** small `?` icon button in the top-right of each connection card. Click opens the modal. The same modal/registry serves marketplaces AND social cards.

---

## 3. Bundle B — Landing & Sign-up

### 3.1 Strip the prompt-save behavior

Three small edits, no new files:

1. `src/components/landing/ChatInput.tsx` — change `submit()` to always route to `signupHref` with no `?q=` query string. Rename prop `signinHref` → `signupHref` for clarity.
2. `src/components/landing/Hero.tsx` — pass `signupHref` instead of `loginHref` to `<ChatInput>`.
3. `src/app/[locale]/(auth)/login/page.tsx` — delete the `seedQuery` `useEffect` block and the `useSearchParams` import.

The submit button on the landing chat now becomes a stylized CTA: type whatever you want, press send → land on the sign-up form.

### 3.2 Center the sign-up page

Split the auth layout so login and sign-up can diverge without flag-checks.

**Before:**
- `src/app/[locale]/(auth)/layout.tsx` — two-column shell shared by both routes.

**After:**
- `src/app/[locale]/(auth)/layout.tsx` — minimal wrapper that renders only `{children}` plus the persistent atmosphere blob.
- `src/app/[locale]/(auth)/login/layout.tsx` — the existing two-column shell, moved verbatim (so login is unchanged).
- `src/app/[locale]/(auth)/signup/layout.tsx` — new layout: single full-bleed `<main>` with `display: grid; place-items: center; min-height: 100vh`, sign-up card rendered inside. No aside.

The sign-up card content itself (`signup/page.tsx`) doesn't change.

---

## 4. Bundle C — Captain

### 4.1 Streaming + better errors

**Problem.** `src/app/api/agent/route.ts` awaits `captainAgent(...)` to completion and only then writes one `'final'` event. If Gemini takes 20–40 s the UI sits on the thinking-dots indicator with zero feedback; if Gemini errors, the user sees an opaque red toast.

**Fix — emit incremental events.** Four event types over the existing newline-delimited JSON stream:

| Type | Payload | When |
|---|---|---|
| `conversation_created` | `{ conversationId: string }` | First event when the request creates a new conversation row (see §4.2) |
| `thinking` | `{ stage: 'planning' \| 'tool_call', agent?: string, tool?: string }` | Forwarded from Genkit's tool-call middleware as the model decides what to do |
| `final` | `{ data: CaptainBrief }` | When the flow returns |
| `error` | `{ code: 'gemini_unauthorized' \| 'gemini_quota' \| 'no_tools_called' \| 'unknown', message: string }` | On any throw |

Genkit exposes per-tool callbacks via `ai.defineFlow` middleware. The route wraps the flow with a middleware that pushes a `thinking` event on each tool call (`runSeoAgent`, `runMarketingAgent`, etc.) before forwarding.

`ChatPanel.tsx` learns to render `thinking` events: the existing `ThinkingIndicator` gains a swappable label — "Pazarlama ajanı çağrılıyor…" — so the user sees life within ~1–2 s of pressing send.

**Diagnostics.** Implementation begins by running the captain end-to-end with logging on to confirm the actual failure mode (missing key vs. timeout vs. tool error). The error-code mapping above is set up so the *next* time the user hits a problem the toast tells them exactly what to fix.

### 4.2 Conversation history

**Schema** (same migration as §2.1: `20260519000001_app_mode_and_chat.sql`):

```sql
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Yeni sohbet',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_conversations_profile_updated
  on public.conversations(profile_id, updated_at desc);

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
```

**RLS** (added to `20260514000002_rls_policies.sql` or a new policies migration): users can `select / insert / update / delete` only their own `conversations`, and only `messages` whose parent conversation they own.

**Routes.**

| Route | Behavior |
|---|---|
| `/dashboard/chat` | Loads the chat shell with no active conversation. First send → server creates a new `conversations` row, then `router.replace('/dashboard/chat/<id>')`. |
| `/dashboard/chat/[id]` | Loads conversation + messages on the server, passes into `ChatPanel`. |

**API.**

- `POST /api/agent` — extended with optional `conversationId` in body. If present, the route writes the user message + final captain message into `messages`. If absent (new chat), it inserts a `conversations` row first and returns the new id in a `'conversation_created'` event so the client can update its URL without flicker.
- `GET /api/conversations` — list the user's conversations, paginated by `updated_at desc`, limit 50.
- `PATCH /api/conversations/[id]` — rename (body: `{ title }`).
- `DELETE /api/conversations/[id]` — delete.

**Title generation.** When the captain returns a `final` event and the conversation's title is still the default `'Yeni sohbet'`, the server sets it to the first user message truncated to 40 chars. No extra LLM call. Inexpensive, deterministic, easy to override via rename.

**UI — chat page grid changes.**

```
Current:  [ conversation | live trace ]      (2.1fr / 1fr)
New:      [ chats | conversation | trace ]   (240px / 1fr / 320px)
```

On mobile (`< 900px`) the chats column collapses into a header dropdown ("Sohbetler ▾") at the top of the conversation pane.

**Chat list row.** Title (first 40 chars) on top, relative time below ("3 dk önce"). Active row highlighted. Hover reveals a `…` button → menu with **Rename** (inline edit) and **Delete** (confirm modal).

**Hydration.** `ChatPanel` accepts an optional `initialMessages` prop. When loaded from `/dashboard/chat/[id]`, it hydrates from DB-fetched messages. When loaded from `/dashboard/chat`, `initialMessages` is empty.

---

## 5. Files touched (rollup)

**New:**

- `supabase/migrations/20260519000001_app_mode_and_chat.sql`
- `src/lib/app-mode.ts`
- `src/lib/connect-guides/{index.ts, shopify.tsx, trendyol.tsx, hepsiburada.tsx, etsy.tsx, instagram.tsx}`
- `src/components/AppModeProvider.tsx`
- `src/components/ConnectHelpModal.tsx`
- `src/components/ConnectionRequired.tsx`
- `src/components/chat/ChatList.tsx` (new chat-history rail)
- `src/app/[locale]/(dashboard)/dashboard/chat/[id]/page.tsx`
- `src/app/[locale]/(dashboard)/dashboard/settings/actions.ts`
- `src/app/[locale]/(auth)/login/layout.tsx` (existing two-column shell moved here)
- `src/app/[locale]/(auth)/signup/layout.tsx` (new centered shell)
- `src/app/api/conversations/route.ts`
- `src/app/api/conversations/[id]/route.ts`
- `public/connect-guides/<platform>-<n>.png` (placeholder screenshots — 1 per step)

**Modified:**

- `src/app/[locale]/(auth)/layout.tsx` (slimmed)
- `src/app/[locale]/(auth)/login/page.tsx` (drop seedQuery)
- `src/components/landing/ChatInput.tsx` (route to signup, no `?q=`)
- `src/components/landing/Hero.tsx` (prop rename)
- `src/app/[locale]/(dashboard)/dashboard/settings/SettingsClient.tsx` (mode card + socials grid + `?` buttons)
- `src/app/[locale]/(dashboard)/dashboard/chat/page.tsx` (grid columns; pass conversation id; render ChatList)
- `src/components/ChatPanel.tsx` (initialMessages prop, thinking-event rendering, conversationId)
- `src/app/api/agent/route.ts` (streaming events, conversationId, persist messages, error codes)
- `src/agents/captain.ts` (accept `mode`, route tools accordingly)
- `src/agents/tools/shopify-tools.ts` (mock vs real branch)
- `supabase/migrations/20260514000002_rls_policies.sql` (RLS for new tables — or add a new policies migration that's strictly additive)

---

## 6. Open questions deferred to implementation

- Exact screenshot images per platform — placeholders ship; real screenshots are a content-fill task.
- Whether to persist `connections` (marketplaces + socials) to the DB. Out of scope here; today's localStorage approach is preserved. A follow-up spec should move to Supabase Vault as the existing TODO in `SettingsClient.tsx` calls out.
- Streaming the captain's text token-by-token (vs. per-tool-call milestones). The current spec covers per-tool milestones, which is the highest-leverage UX improvement. Token streaming is a follow-up.

---

## 7. Non-goals

- Real Instagram Graph API OAuth — explicitly out of scope; ships as the same demo-form pattern.
- Replacing localStorage for marketplace connections — out of scope.
- Adding more specialists to the captain — out of scope.
- Multi-tenant features beyond the existing single-profile model — out of scope.

---

## 8. Acceptance criteria

A reviewer should be able to verify the work by:

1. Toggling **Çalışma Modu** in Settings and watching dashboard pages either show real data or display `<ConnectionRequired>` cards in Real mode with no connection.
2. Clicking the `?` icon on every marketplace and the Instagram card → modal opens with steps, screenshots (placeholders OK), and a working "Open admin" link.
3. Adding an Instagram connection via the new card → the Social page's Instagram button changes its toast message to reference the connected handle.
4. From the landing page, typing a query and pressing send → lands on `/signup` with no `?q=` and no toast on the login page.
5. The sign-up page is full-screen centered with no brand aside. Login page is unchanged.
6. Sending a query in the Captain chat → within ~2 s, sees an evolving "<agent> çağrılıyor…" indicator. On error, sees a specific error message (e.g., "Gemini API anahtarı eksik").
7. After a captain reply, refreshing the page → conversation is still there, switchable from the chat list, continuable from where you left off. Renaming and deleting work.

---

## 9. Risks

- **Genkit middleware shape.** If Genkit doesn't expose a clean per-tool-call hook for our version, we fall back to coarser milestones (planning / executing / finalizing) — still fixes the silent-UI problem.
- **Migration ordering.** The new migration must run cleanly on top of the existing schema. Ordered timestamp keeps Supabase CLI happy.
- **RLS coverage.** `conversations` and `messages` need policies before they're useful; missing them leaks across users. Implementation checklist will include policy verification.
