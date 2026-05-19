# Multi-feature Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 7 UX/architecture changes from `docs/superpowers/specs/2026-05-19-multi-feature-design.md`: global Mock/Real mode toggle, reusable "How to connect" modal, Instagram social card, landing→signup routing, centered sign-up page, Captain streaming-with-error-codes, and Captain conversation history.

**Architecture:**
- New `profiles.app_mode` column drives a single global mode flag, surfaced to clients via `<AppModeProvider>` and to server routes via `getAppMode(supabase)`.
- One reusable `<ConnectHelpModal>` + a `src/lib/connect-guides/` registry serves all marketplaces and the new Instagram card.
- A single new migration (`20260519000001_app_mode_and_chat.sql`) adds `app_mode`, `conversations`, `messages`, and RLS policies in one shot.
- `/api/agent` switches to event-stream semantics: `conversation_created` → `thinking` (per tool call) → `final` | `error`, with typed error codes so the toast tells the user what's wrong.

**Tech Stack:** Next.js 15 App Router, Mantine v8, Supabase, Genkit + Gemini, Vitest, Playwright, TypeScript.

---

## File Structure (locked here so tasks reference it consistently)

**New files:**

| Path | Responsibility |
|---|---|
| `supabase/migrations/20260519000001_app_mode_and_chat.sql` | DB: `profiles.app_mode` column + `conversations` + `messages` tables + RLS policies |
| `src/lib/app-mode.ts` | `AppMode` type + `getAppMode(supabase)` server helper |
| `src/lib/connections.ts` | `useConnections()` client hook + types — central read of localStorage marketplaces+socials |
| `src/lib/connect-guides/index.ts` | `GUIDES: Record<PlatformId, ConnectGuide>` + types |
| `src/lib/connect-guides/shopify.tsx` | Shopify step content |
| `src/lib/connect-guides/trendyol.tsx` | Trendyol step content |
| `src/lib/connect-guides/hepsiburada.tsx` | Hepsiburada step content |
| `src/lib/connect-guides/etsy.tsx` | Etsy step content |
| `src/lib/connect-guides/instagram.tsx` | Instagram step content |
| `src/components/AppModeProvider.tsx` | React context provider + `useAppMode()` hook |
| `src/components/ConnectHelpModal.tsx` | Reusable Mantine Modal that renders a guide |
| `src/components/ConnectionRequired.tsx` | Real-mode gate UI shown when needed platform not connected |
| `src/components/chat/ChatList.tsx` | Sidebar rail with the user's conversation list |
| `src/app/[locale]/(dashboard)/dashboard/settings/actions.ts` | Server actions: `setAppMode` |
| `src/app/[locale]/(dashboard)/dashboard/chat/[id]/page.tsx` | Loads + renders an existing conversation |
| `src/app/[locale]/(auth)/login/layout.tsx` | Existing two-column shell, moved here |
| `src/app/[locale]/(auth)/signup/layout.tsx` | New full-bleed centered shell |
| `src/app/api/conversations/route.ts` | `GET` list user's conversations |
| `src/app/api/conversations/[id]/route.ts` | `PATCH` rename, `DELETE` remove |
| `public/connect-guides/placeholder.svg` | Generic placeholder used until real screenshots ship |
| `tests/unit/app-mode.test.ts` | Unit test for `getAppMode` |
| `tests/unit/connect-guides.test.ts` | Unit test that every platform has a guide |
| `tests/e2e/mode-toggle.spec.ts` | E2E: toggle mode, see gating |
| `tests/e2e/connect-help.spec.ts` | E2E: open modal on each card |
| `tests/e2e/landing-to-signup.spec.ts` | E2E: landing chat → /signup (no `?q`) |
| `tests/e2e/chat-history.spec.ts` | E2E: send, reload, conversation persists |

**Modified files:**

- `src/app/[locale]/(auth)/layout.tsx` — slimmed to a passthrough
- `src/app/[locale]/(auth)/login/page.tsx` — drop `seedQuery` effect
- `src/components/landing/ChatInput.tsx` — route to `signupHref`, no `?q=`
- `src/components/landing/Hero.tsx` — pass `signupHref` to ChatInput
- `src/app/[locale]/(dashboard)/layout.tsx` — fetch mode + wrap in `AppModeProvider`
- `src/app/[locale]/(dashboard)/dashboard/settings/SettingsClient.tsx` — mode card + socials grid + `?` buttons
- `src/app/[locale]/(dashboard)/dashboard/chat/page.tsx` — 3-column grid, ChatList, optional conversation
- `src/app/[locale]/(dashboard)/dashboard/social/SocialClient.tsx` — IG button references connected handle
- `src/app/[locale]/(dashboard)/dashboard/products/page.tsx` — gate behind ConnectionRequired in real mode
- `src/app/[locale]/(dashboard)/dashboard/cashflow/page.tsx` — same
- `src/app/[locale]/(dashboard)/dashboard/reviews/page.tsx` — same
- `src/components/ChatPanel.tsx` — `initialMessages`, `conversationId`, thinking-event rendering, error codes
- `src/app/api/agent/route.ts` — streamed events, conversation persistence, error codes, mode read

---

## Phase 0 — Foundation

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260519000001_app_mode_and_chat.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260519000001_app_mode_and_chat.sql`:

```sql
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
  title text not null default 'Yeni sohbet',
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
```

- [ ] **Step 2: Apply locally**

```bash
# Either via Supabase CLI if installed:
supabase db push
# OR — if using the hosted MCP — paste the SQL via the Supabase SQL editor.
```

Expected: migration runs cleanly. Run:

```bash
# Sanity check via Supabase CLI
supabase db diff
```

Expected: empty diff.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260519000001_app_mode_and_chat.sql
git commit -m "feat(db): app_mode column + conversations/messages tables with RLS"
```

---

### Task 2: `app-mode.ts` helper + unit test

**Files:**
- Create: `src/lib/app-mode.ts`
- Test: `tests/unit/app-mode.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/app-mode.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { getAppMode } from '@/lib/app-mode';

function makeSupabase(opts: {
  user?: { id: string } | null;
  appMode?: string | null;
  error?: unknown;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user ?? null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            opts.error
              ? { data: null, error: opts.error }
              : { data: { app_mode: opts.appMode ?? null }, error: null },
          ),
        }),
      }),
    }),
  } as unknown as Parameters<typeof getAppMode>[0];
}

describe('getAppMode', () => {
  it('returns mock when there is no user', async () => {
    const sb = makeSupabase({ user: null });
    expect(await getAppMode(sb)).toBe('mock');
  });

  it('returns the stored mode for a logged-in user', async () => {
    const sb = makeSupabase({ user: { id: 'u1' }, appMode: 'real' });
    expect(await getAppMode(sb)).toBe('real');
  });

  it('defaults to mock when the row returns null', async () => {
    const sb = makeSupabase({ user: { id: 'u1' }, appMode: null });
    expect(await getAppMode(sb)).toBe('mock');
  });
});
```

- [ ] **Step 2: Run test, expect fail**

```bash
npx vitest run tests/unit/app-mode.test.ts
```

Expected: `Cannot find module '@/lib/app-mode'`.

- [ ] **Step 3: Implement the helper**

Create `src/lib/app-mode.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

export type AppMode = 'mock' | 'real';

export async function getAppMode(supabase: SupabaseClient): Promise<AppMode> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'mock';

  const { data } = await supabase
    .from('profiles')
    .select('app_mode')
    .eq('id', user.id)
    .single();

  const mode = (data?.app_mode as AppMode | null) ?? 'mock';
  return mode === 'real' ? 'real' : 'mock';
}
```

- [ ] **Step 4: Run test, expect pass**

```bash
npx vitest run tests/unit/app-mode.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/app-mode.ts tests/unit/app-mode.test.ts
git commit -m "feat(lib): app-mode server helper + unit tests"
```

---

### Task 3: `AppModeProvider` + dashboard wiring

**Files:**
- Create: `src/components/AppModeProvider.tsx`
- Modify: `src/app/[locale]/(dashboard)/layout.tsx`

- [ ] **Step 1: Create the provider**

Create `src/components/AppModeProvider.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AppMode } from '@/lib/app-mode';

interface AppModeContextValue {
  mode: AppMode;
  setMode: (next: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({
  initialMode,
  children,
}: {
  initialMode: AppMode;
  children: ReactNode;
}) {
  const [mode, setModeState] = useState<AppMode>(initialMode);
  const setMode = useCallback((next: AppMode) => setModeState(next), []);
  return (
    <AppModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeContextValue {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error('useAppMode must be used inside <AppModeProvider>');
  return ctx;
}
```

- [ ] **Step 2: Wire the provider into the dashboard layout**

Modify `src/app/[locale]/(dashboard)/layout.tsx`. Replace the file's body:

```tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';
import { AppModeProvider } from '@/components/AppModeProvider';
import { getAppMode } from '@/lib/app-mode';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const [profileResult, mode] = await Promise.all([
    supabase
      .from('profiles')
      .select('business_name, preferred_language')
      .eq('id', user.id)
      .single(),
    getAppMode(supabase),
  ]);

  return (
    <AppModeProvider initialMode={mode}>
      <DashboardShell
        locale={locale}
        businessName={profileResult.data?.business_name ?? 'KOBİ Sahibi'}
      >
        {children}
      </DashboardShell>
    </AppModeProvider>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppModeProvider.tsx src/app/[locale]/\(dashboard\)/layout.tsx
git commit -m "feat(dashboard): AppModeProvider hydrated from server"
```

---

### Task 4: `useConnections` central hook

**Files:**
- Create: `src/lib/connections.ts`

- [ ] **Step 1: Implement the hook**

Create `src/lib/connections.ts`:

```ts
'use client';

import { useEffect, useState } from 'react';

export type MarketplaceId = 'shopify' | 'trendyol' | 'hepsiburada' | 'etsy';
export type SocialId = 'instagram' | 'twitter' | 'facebook';
export type PlatformId = MarketplaceId | SocialId;

export interface MarketplaceConnection {
  url: string;
  key: string;
  storeName: string;
  connectedAt: string;
}

export interface SocialConnection {
  handle: string;
  token: string;
  displayName: string;
  connectedAt: string;
}

export type MarketplaceMap = Partial<Record<MarketplaceId, MarketplaceConnection>>;
export type SocialMap = Partial<Record<SocialId, SocialConnection>>;

export const MARKETPLACES_STORAGE_KEY = 'kobi-kaptani.marketplaces';
export const SOCIALS_STORAGE_KEY      = 'kobi-kaptani.socials';

function readMap<T extends Record<string, unknown>>(key: string): T {
  if (typeof window === 'undefined') return {} as T;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function writeMap<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Same-window listeners (storage event doesn't fire on the writing tab)
    window.dispatchEvent(new Event(`${key}:changed`));
  } catch {
    /* ignore */
  }
}

function useStoredMap<T extends Record<string, unknown>>(key: string): [T, (next: T) => void] {
  const [state, setState] = useState<T>({} as T);

  useEffect(() => {
    setState(readMap<T>(key));
    const handler = () => setState(readMap<T>(key));
    window.addEventListener(`${key}:changed`, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(`${key}:changed`, handler);
      window.removeEventListener('storage', handler);
    };
  }, [key]);

  const save = (next: T) => {
    setState(next);
    writeMap(key, next);
  };

  return [state, save];
}

export function useConnections() {
  const [marketplaces, setMarketplaces] = useStoredMap<MarketplaceMap>(MARKETPLACES_STORAGE_KEY);
  const [socials, setSocials]           = useStoredMap<SocialMap>(SOCIALS_STORAGE_KEY);

  return {
    marketplaces,
    socials,
    setMarketplaces,
    setSocials,
    hasAnyMarketplace: Object.keys(marketplaces).length > 0,
    hasMarketplace: (id: MarketplaceId) => Boolean(marketplaces[id]),
    hasSocial:      (id: SocialId)      => Boolean(socials[id]),
  };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/connections.ts
git commit -m "feat(lib): useConnections hook centralises localStorage connection state"
```

---

## Phase 1 — Settings: Mode toggle

### Task 5: `setAppMode` server action

**Files:**
- Create: `src/app/[locale]/(dashboard)/dashboard/settings/actions.ts`

- [ ] **Step 1: Implement the action**

Create `src/app/[locale]/(dashboard)/dashboard/settings/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { AppMode } from '@/lib/app-mode';

export async function setAppMode(next: AppMode): Promise<{ ok: true } | { error: string }> {
  if (next !== 'mock' && next !== 'real') return { error: 'invalid_mode' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  const { error } = await supabase
    .from('profiles')
    .update({ app_mode: next })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/\(dashboard\)/dashboard/settings/actions.ts
git commit -m "feat(settings): setAppMode server action"
```

---

### Task 6: Mode toggle card in Settings

**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/settings/SettingsClient.tsx`

- [ ] **Step 1: Add the mode card above the marketplace grid**

In `SettingsClient.tsx`, add these imports near the top of the existing imports:

```tsx
import { Switch } from '@mantine/core';
import { IconSettings as IconMode } from '@tabler/icons-react';
import { useTransition } from 'react';
import { useAppMode } from '@/components/AppModeProvider';
import { useConnections } from '@/lib/connections';
import { setAppMode } from './actions';
```

Then inside `SettingsClient`, just before the `return (`, add:

```tsx
const { mode, setMode } = useAppMode();
const { hasAnyMarketplace } = useConnections();
const [modePending, startModeTransition] = useTransition();

const toggleMode = (checked: boolean) => {
  const next = checked ? 'real' : 'mock';
  if (next === 'real' && !hasAnyMarketplace) {
    notifications.show({
      color: 'red',
      message: isTr
        ? 'Önce en az bir mağaza bağla.'
        : 'Connect at least one store first.',
    });
    return;
  }
  startModeTransition(async () => {
    const result = await setAppMode(next);
    if ('error' in result) {
      notifications.show({ color: 'red', message: result.error });
      return;
    }
    setMode(next);
    notifications.show({
      color: 'green',
      message: isTr
        ? `Mod değişti: ${next === 'real' ? 'Gerçek' : 'Demo'}`
        : `Mode set to ${next === 'real' ? 'Real' : 'Demo'}`,
      autoClose: 2500,
    });
  });
};
```

- [ ] **Step 2: Render the card**

Inside the existing outer container `<div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 920 }}>`, insert the following block **immediately after the `{/* Header */}` div and before the marketplace grid**:

```tsx
{/* Mode card */}
<section
  style={{
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 20,
    background: 'var(--bg-elev)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
  }}
>
  <span
    style={{
      width: 36, height: 36, borderRadius: 10,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'color-mix(in srgb, var(--c-emerald) 12%, transparent)',
      color: 'var(--c-emerald)', flexShrink: 0,
    }}
  >
    <IconMode size={18} stroke={2} />
  </span>
  <div style={{ flex: 1 }}>
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
      {isTr ? 'Çalışma Modu' : 'Working Mode'}
    </h3>
    <p style={{ margin: '4px 0 12px', fontSize: 13, color: 'var(--fg-mute)', lineHeight: 1.55 }}>
      {isTr
        ? 'Demo: örnek veri ile çalışır. Gerçek: en az bir mağaza bağlı olmalı.'
        : 'Demo: runs on seeded data. Real: requires at least one connected store.'}
    </p>
    <Switch
      checked={mode === 'real'}
      disabled={modePending}
      onChange={(e) => toggleMode(e.currentTarget.checked)}
      size="md"
      onLabel={isTr ? 'GERÇEK' : 'REAL'}
      offLabel={isTr ? 'DEMO' : 'DEMO'}
      label={
        <span style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>
          {mode === 'real'
            ? (isTr ? 'Gerçek mod aktif' : 'Real mode active')
            : (isTr ? 'Demo modu' : 'Demo mode')}
        </span>
      }
    />
  </div>
</section>
```

- [ ] **Step 3: Smoke test in the browser**

```bash
npm run dev
```

Open `http://localhost:3000/tr/dashboard/settings`. Expected: the new mode card appears at the top. Toggling with zero connections shows a red toast. Connecting a store then toggling to Real shows a green toast.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/\(dashboard\)/dashboard/settings/SettingsClient.tsx
git commit -m "feat(settings): Mock/Real mode toggle card with connection-gating"
```

---

## Phase 2 — How-to-connect modal

### Task 7: Connect-guide registry + per-platform content

**Files:**
- Create: `src/lib/connect-guides/index.ts`
- Create: `src/lib/connect-guides/shopify.tsx`
- Create: `src/lib/connect-guides/trendyol.tsx`
- Create: `src/lib/connect-guides/hepsiburada.tsx`
- Create: `src/lib/connect-guides/etsy.tsx`
- Create: `src/lib/connect-guides/instagram.tsx`
- Test: `tests/unit/connect-guides.test.ts`

- [ ] **Step 1: Write the registry test**

Create `tests/unit/connect-guides.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { GUIDES, type PlatformWithGuide } from '@/lib/connect-guides';

const REQUIRED: PlatformWithGuide[] = [
  'shopify',
  'trendyol',
  'hepsiburada',
  'etsy',
  'instagram',
];

describe('connect guides registry', () => {
  it('has an entry for every required platform', () => {
    for (const p of REQUIRED) {
      expect(GUIDES[p], `missing guide for ${p}`).toBeDefined();
      expect(GUIDES[p].steps.length).toBeGreaterThan(0);
      expect(GUIDES[p].title.tr).toBeTruthy();
      expect(GUIDES[p].title.en).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
npx vitest run tests/unit/connect-guides.test.ts
```

Expected: `Cannot find module '@/lib/connect-guides'`.

- [ ] **Step 3: Create the types + registry**

Create `src/lib/connect-guides/index.ts`:

```ts
export type PlatformWithGuide =
  | 'shopify'
  | 'trendyol'
  | 'hepsiburada'
  | 'etsy'
  | 'instagram';

export interface GuideStep {
  tr: string;
  en: string;
  screenshot?: string; // path under /public, e.g. /connect-guides/shopify-1.png
  copySnippet?: string;
}

export interface ConnectGuide {
  title:    { tr: string; en: string };
  blurb:    { tr: string; en: string };
  adminUrl: string;
  steps:    GuideStep[];
}

import { guide as shopify }     from './shopify';
import { guide as trendyol }    from './trendyol';
import { guide as hepsiburada } from './hepsiburada';
import { guide as etsy }        from './etsy';
import { guide as instagram }   from './instagram';

export const GUIDES: Record<PlatformWithGuide, ConnectGuide> = {
  shopify,
  trendyol,
  hepsiburada,
  etsy,
  instagram,
};
```

- [ ] **Step 4: Create the per-platform guides**

Create `src/lib/connect-guides/shopify.tsx`:

```tsx
import type { ConnectGuide } from './index';

export const guide: ConnectGuide = {
  title: { tr: 'Shopify mağazanı bağla', en: 'Connect your Shopify store' },
  blurb: {
    tr: 'Ürünler, siparişler ve müşteri verisi anlık senkron olsun diye.',
    en: 'So products, orders, and customer data sync in real time.',
  },
  adminUrl: 'https://admin.shopify.com',
  steps: [
    {
      tr: 'Shopify yöneticine gir → Settings → Apps and sales channels → "Develop apps".',
      en: 'In your Shopify admin → Settings → Apps and sales channels → "Develop apps".',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: '"Create an app" → uygulama adı: "KOBİ Kaptanı" → Create.',
      en: 'Click "Create an app" → name it "KOBI Kaptani" → Create.',
      screenshot: '/connect-guides/placeholder.svg',
      copySnippet: 'KOBİ Kaptanı',
    },
    {
      tr: 'Configuration → "Configure Admin API scopes": read_products, read_orders, read_customers.',
      en: 'Configuration → "Configure Admin API scopes": read_products, read_orders, read_customers.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'API credentials → "Install app" → Admin API access token\'ı kopyala.',
      en: 'API credentials → "Install app" → copy the Admin API access token.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Bu ekranda Mağaza URL\'si (magaza-adin.myshopify.com) ve token\'ı yapıştır.',
      en: 'Paste the store URL (your-store.myshopify.com) and the token into this app.',
      screenshot: '/connect-guides/placeholder.svg',
    },
  ],
};
```

Create `src/lib/connect-guides/trendyol.tsx`:

```tsx
import type { ConnectGuide } from './index';

export const guide: ConnectGuide = {
  title: { tr: 'Trendyol bağlantısı', en: 'Connect Trendyol' },
  blurb: {
    tr: 'Pazaryeri sıralaması ve rakip fiyat takibi için.',
    en: 'For marketplace ranking and competitor price tracking.',
  },
  adminUrl: 'https://partner.trendyol.com',
  steps: [
    {
      tr: 'Trendyol Partner Paneli → Entegrasyonlar → API Bilgileri.',
      en: 'Trendyol Partner Panel → Integrations → API Information.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Supplier ID\'ni not et (sağ üst köşede ya da sözleşmende yazıyor).',
      en: 'Note your Supplier ID (shown top-right or in your contract).',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'API Key ve API Secret üret → ikisini de kopyala.',
      en: 'Generate API Key and API Secret → copy both.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Bu ekranda Supplier ID\'yi URL alanına, "key:secret" formatını anahtar alanına yapıştır.',
      en: 'Paste the Supplier ID into URL field and "key:secret" into the key field.',
      screenshot: '/connect-guides/placeholder.svg',
    },
  ],
};
```

Create `src/lib/connect-guides/hepsiburada.tsx`:

```tsx
import type { ConnectGuide } from './index';

export const guide: ConnectGuide = {
  title: { tr: 'Hepsiburada bağlantısı', en: 'Connect Hepsiburada' },
  blurb: {
    tr: 'Stok ve fiyat yönetimi için Merchant ID + API erişimi.',
    en: 'Merchant ID + API access for inventory and pricing.',
  },
  adminUrl: 'https://merchant.hepsiburada.com',
  steps: [
    {
      tr: 'Hepsiburada Mağaza Paneli → Hesap Yönetimi → Entegrasyon → "API Anahtarı".',
      en: 'Merchant Panel → Account → Integration → "API Key".',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Merchant ID\'ni not et (Hesap Bilgileri sayfasında).',
      en: 'Copy your Merchant ID from the Account Info page.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Yeni API Anahtarı talep et → onaylanınca kopyala.',
      en: 'Request a new API Key → copy it once approved.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Bu ekranda Merchant ID\'yi URL alanına, API Anahtarını anahtar alanına yapıştır.',
      en: 'Paste Merchant ID into URL field and API Key into the key field.',
      screenshot: '/connect-guides/placeholder.svg',
    },
  ],
};
```

Create `src/lib/connect-guides/etsy.tsx`:

```tsx
import type { ConnectGuide } from './index';

export const guide: ConnectGuide = {
  title: { tr: 'Etsy bağlantısı', en: 'Connect Etsy' },
  blurb: {
    tr: 'Uluslararası satış için yorum ve sıralama analizi.',
    en: 'For international reviews and ranking analysis.',
  },
  adminUrl: 'https://www.etsy.com/your/account/apps',
  steps: [
    {
      tr: 'Etsy → Your account → Apps → "Register an app".',
      en: 'Etsy → Your account → Apps → "Register an app".',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Uygulama adı: "KOBİ Kaptanı" → "Listings_r, shops_r, transactions_r" scope\'larını seç.',
      en: 'App name: "KOBI Kaptani" → select scopes "listings_r, shops_r, transactions_r".',
      copySnippet: 'KOBİ Kaptanı',
    },
    {
      tr: 'OAuth flow ile bir Personal Token üret.',
      en: 'Generate a Personal Token via the OAuth flow.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Mağaza adresini (shop-name.etsy.com) URL alanına, token\'ı anahtar alanına yapıştır.',
      en: 'Paste shop URL (shop-name.etsy.com) into URL field and the token into the key field.',
      screenshot: '/connect-guides/placeholder.svg',
    },
  ],
};
```

Create `src/lib/connect-guides/instagram.tsx`:

```tsx
import type { ConnectGuide } from './index';

export const guide: ConnectGuide = {
  title: { tr: 'Instagram bağlantısı', en: 'Connect Instagram' },
  blurb: {
    tr: 'İşletme hesabını bağla — paylaşımlar @kullanici_adin altında görünsün.',
    en: 'Connect your business account so posts attribute to @yourhandle.',
  },
  adminUrl: 'https://business.facebook.com',
  steps: [
    {
      tr: 'Instagram hesabının "Business" türüne dönüştürülmüş olmalı (Settings → Account type).',
      en: 'Your Instagram account must be a "Business" account (Settings → Account type).',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Facebook Business Suite → Settings → "Business Assets" → Instagram hesabını bağla.',
      en: 'Facebook Business Suite → Settings → "Business Assets" → link the Instagram account.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Meta for Developers → My Apps → "Create App" → "Business" tipi → Instagram Graph API ekle.',
      en: 'Meta for Developers → My Apps → "Create App" → "Business" type → add Instagram Graph API.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Graph API Explorer\'dan uzun-ömürlü bir kullanıcı token\'ı üret.',
      en: 'Generate a long-lived user access token from the Graph API Explorer.',
      screenshot: '/connect-guides/placeholder.svg',
    },
    {
      tr: 'Kullanıcı adını (@handle) ve token\'ı bu ekrandaki Instagram formuna yapıştır.',
      en: 'Paste the username (@handle) and token into the Instagram form here.',
      screenshot: '/connect-guides/placeholder.svg',
    },
  ],
};
```

- [ ] **Step 5: Run test, expect pass**

```bash
npx vitest run tests/unit/connect-guides.test.ts
```

Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/connect-guides tests/unit/connect-guides.test.ts
git commit -m "feat(connect-guides): per-platform content registry + tests"
```

---

### Task 8: Placeholder screenshot

**Files:**
- Create: `public/connect-guides/placeholder.svg`

- [ ] **Step 1: Create the placeholder**

Create `public/connect-guides/placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1f2c"/>
      <stop offset="100%" stop-color="#0f1219"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#g)" rx="16"/>
  <g fill="#4a5468" font-family="system-ui, -apple-system, sans-serif" font-size="18" text-anchor="middle">
    <text x="320" y="170">Screenshot placeholder</text>
    <text x="320" y="200" font-size="13" fill="#3a4254">
      Replace with /public/connect-guides/&lt;platform&gt;-&lt;n&gt;.png
    </text>
  </g>
  <rect x="32" y="32" width="576" height="296" fill="none" stroke="#252b3a" stroke-width="1" stroke-dasharray="4 4" rx="10"/>
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add public/connect-guides/placeholder.svg
git commit -m "feat(assets): SVG placeholder for connect-guide screenshots"
```

---

### Task 9: `ConnectHelpModal` component

**Files:**
- Create: `src/components/ConnectHelpModal.tsx`

- [ ] **Step 1: Implement the modal**

Create `src/components/ConnectHelpModal.tsx`:

```tsx
'use client';

import { Modal } from '@mantine/core';
import { useState } from 'react';
import Image from 'next/image';
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
} from '@tabler/icons-react';
import {
  GUIDES,
  type PlatformWithGuide,
} from '@/lib/connect-guides';

export function ConnectHelpModal({
  platform,
  opened,
  onClose,
  locale,
}: {
  platform: PlatformWithGuide;
  opened: boolean;
  onClose: () => void;
  locale: string;
}) {
  const isTr = locale === 'tr';
  const guide = GUIDES[platform];
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied((c) => (c === idx ? null : c)), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      withCloseButton
      title={
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {isTr ? guide.title.tr : guide.title.en}
        </span>
      }
      styles={{
        content: { background: 'var(--bg-elev)', color: 'var(--fg)' },
        header:  { background: 'var(--bg-elev)', color: 'var(--fg)', borderBottom: '1px solid var(--border)' },
      }}
    >
      <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--fg-mute)', margin: '0 0 20px' }}>
        {isTr ? guide.blurb.tr : guide.blurb.en}
      </p>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {guide.steps.map((step, idx) => {
          const text = isTr ? step.tr : step.en;
          return (
            <li key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 26, height: 26, borderRadius: 999,
                  background: 'color-mix(in srgb, var(--c-emerald) 14%, transparent)',
                  color: 'var(--c-emerald)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  border: '1px solid var(--border)',
                }}
              >
                {idx + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--fg)' }}>{text}</p>

                {step.copySnippet && (
                  <button
                    type="button"
                    onClick={() => copy(step.copySnippet!, idx)}
                    className="social-mini-btn"
                    style={{ marginTop: 8 }}
                  >
                    {copied === idx ? <IconCheck size={12} stroke={2.4} /> : <IconCopy size={12} stroke={2.2} />}
                    <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>{step.copySnippet}</code>
                  </button>
                )}

                {step.screenshot && (
                  <div
                    style={{
                      marginTop: 10,
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      maxWidth: 480,
                    }}
                  >
                    <Image
                      src={step.screenshot}
                      alt=""
                      width={480}
                      height={270}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a
          href={guide.adminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary btn-small"
        >
          {isTr ? 'Yönetici Panelini Aç' : 'Open Admin Panel'}
          <IconExternalLink size={13} stroke={2.4} />
        </a>
        <button type="button" className="btn-ghost btn-small" onClick={onClose}>
          {isTr ? 'Kapat' : 'Close'}
        </button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ConnectHelpModal.tsx
git commit -m "feat(ui): ConnectHelpModal renders per-platform connect guide"
```

---

### Task 10: Wire `?` buttons on marketplace cards

**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/settings/SettingsClient.tsx`

- [ ] **Step 1: Add imports**

In `SettingsClient.tsx`, add to imports:

```tsx
import { IconHelp } from '@tabler/icons-react';
import { ConnectHelpModal } from '@/components/ConnectHelpModal';
import type { PlatformWithGuide } from '@/lib/connect-guides';
```

- [ ] **Step 2: Add help-modal state**

Inside `SettingsClient`, alongside the other `useState` calls, add:

```tsx
const [helpFor, setHelpFor] = useState<PlatformWithGuide | null>(null);
```

- [ ] **Step 3: Render the `?` button inside `<div className="marketplace-card-head">`**

Find the `<div className="marketplace-card-head">` block and change it to include a help button. Replace:

```tsx
<div className="marketplace-card-head">
  <span className="marketplace-icon" style={{ color: m.accent, borderColor: m.accent }}>
    <m.Icon size={20} stroke={2} />
  </span>
  <div style={{ flex: 1 }}>
    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
      {m.name}
    </h3>
    {connected && (
      <span className="marketplace-status">
        <IconCheck size={11} stroke={3} /> {isTr ? 'Bağlı' : 'Connected'}
      </span>
    )}
  </div>
</div>
```

with:

```tsx
<div className="marketplace-card-head">
  <span className="marketplace-icon" style={{ color: m.accent, borderColor: m.accent }}>
    <m.Icon size={20} stroke={2} />
  </span>
  <div style={{ flex: 1 }}>
    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
      {m.name}
    </h3>
    {connected && (
      <span className="marketplace-status">
        <IconCheck size={11} stroke={3} /> {isTr ? 'Bağlı' : 'Connected'}
      </span>
    )}
  </div>
  <button
    type="button"
    aria-label={isTr ? 'Nasıl bağlanır?' : 'How to connect'}
    title={isTr ? 'Nasıl bağlanır?' : 'How to connect'}
    onClick={() => setHelpFor(m.id as PlatformWithGuide)}
    style={{
      background: 'transparent',
      border: '1px solid var(--border)',
      color: 'var(--fg-mute)',
      width: 28, height: 28, borderRadius: 8,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
    }}
  >
    <IconHelp size={14} stroke={2.2} />
  </button>
</div>
```

- [ ] **Step 4: Render the modal once at the bottom of the outer wrapper**

Inside the outer `<div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 920 }}>`, just before the closing `</div>`, add:

```tsx
{helpFor && (
  <ConnectHelpModal
    platform={helpFor}
    opened={helpFor !== null}
    onClose={() => setHelpFor(null)}
    locale={locale}
  />
)}
```

- [ ] **Step 5: Smoke test**

```bash
npm run dev
```

Visit `/tr/dashboard/settings`. Click `?` on each marketplace card. Modal opens with the right content. Close works. Open admin link target=_blank works.

- [ ] **Step 6: Commit**

```bash
git add src/app/[locale]/\(dashboard\)/dashboard/settings/SettingsClient.tsx
git commit -m "feat(settings): help buttons on marketplace cards open ConnectHelpModal"
```

---

## Phase 3 — Social accounts grid

### Task 11: Render the social grid + Instagram card

**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/settings/SettingsClient.tsx`

- [ ] **Step 1: Add imports + types**

Add to imports in `SettingsClient.tsx`:

```tsx
import { IconBrandInstagram, IconBrandTwitter, IconBrandFacebook } from '@tabler/icons-react';
import type { SocialConnection, SocialId, SocialMap } from '@/lib/connections';
```

- [ ] **Step 2: Add the social definitions array**

Below the existing `MARKETPLACES` constant, add:

```tsx
interface SocialDef {
  id: SocialId;
  name: string;
  blurb: { tr: string; en: string };
  accent: string;
  Icon: React.ComponentType<{ size?: number; stroke?: number }>;
  comingSoon?: boolean;
  hasGuide?: boolean;
}

const SOCIALS: SocialDef[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    blurb: {
      tr: 'Görselleri @kullanıcı_adın olarak paylaş ve içerik takvimi sun.',
      en: 'Post images as @yourhandle and surface a content calendar.',
    },
    accent: 'var(--c-rose)',
    Icon: IconBrandInstagram,
    hasGuide: true,
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    blurb: {
      tr: 'Yakında — kısa duyurular ve kampanya paylaşımı için.',
      en: 'Coming soon — short announcements and campaign sharing.',
    },
    accent: 'var(--c-teal)',
    Icon: IconBrandTwitter,
    comingSoon: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    blurb: {
      tr: 'Yakında — Facebook Shop ve sayfa paylaşımları için.',
      en: 'Coming soon — Facebook Shop and Page posting.',
    },
    accent: 'var(--c-amber)',
    Icon: IconBrandFacebook,
    comingSoon: true,
  },
];
```

- [ ] **Step 3: Wire social state via useConnections**

In the existing `SettingsClient`, find the `useConnections()` call and destructure socials too:

```tsx
const { hasAnyMarketplace, socials, setSocials } = useConnections();
const [openSocialForm, setOpenSocialForm] = useState<SocialId | null>(null);
```

Then add helpers near the existing `connect`/`disconnect`:

```tsx
const connectSocial = (id: SocialId, data: SocialConnection) => {
  setSocials({ ...socials, [id]: data });
  setOpenSocialForm(null);
  notifications.show({
    color: 'green',
    title: isTr ? 'Bağlandı' : 'Connected',
    message: `${SOCIALS.find(s => s.id === id)?.name} → @${data.handle}`,
    autoClose: 3500,
  });
};

const disconnectSocial = (id: SocialId) => {
  const next: SocialMap = { ...socials };
  delete next[id];
  setSocials(next);
  notifications.show({
    color: 'gray',
    message: isTr ? 'Bağlantı kaldırıldı' : 'Disconnected',
    autoClose: 2500,
  });
};
```

- [ ] **Step 4: Render the social section below the marketplace grid**

After the closing `</div>` of the marketplace grid and before the existing footnote `<p style={{ fontSize: 12.5...}}>`, add:

```tsx
{/* Social accounts header */}
<div>
  <span className="section-eyebrow">{isTr ? 'Sosyal Hesaplar' : 'Social Accounts'}</span>
  <p style={{ marginTop: 8, color: 'var(--fg-mute)', fontSize: 13.5, lineHeight: 1.5, maxWidth: 560 }}>
    {isTr
      ? 'Paylaşımları gerçek hesap adına atıfla yapmak için bağla.'
      : 'Connect so posts can attribute to your real account.'}
  </p>
</div>

{/* Social grid */}
<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16,
  }}
>
  {SOCIALS.map((s) => {
    const conn = socials[s.id];
    const connected = !!conn;
    const isOpen = openSocialForm === s.id;
    return (
      <article
        key={s.id}
        className="marketplace-card"
        style={{
          ...(connected
            ? { borderColor: 'color-mix(in srgb, var(--c-emerald) 35%, var(--border))' }
            : {}),
          opacity: s.comingSoon ? 0.55 : 1,
        }}
      >
        <div className="marketplace-card-head">
          <span className="marketplace-icon" style={{ color: s.accent, borderColor: s.accent }}>
            <s.Icon size={20} stroke={2} />
          </span>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {s.name}
            </h3>
            {s.comingSoon && (
              <span className="marketplace-status" style={{ color: 'var(--fg-mute)' }}>
                {isTr ? 'Yakında' : 'Soon'}
              </span>
            )}
            {connected && (
              <span className="marketplace-status">
                <IconCheck size={11} stroke={3} /> @{conn.handle}
              </span>
            )}
          </div>
          {s.hasGuide && (
            <button
              type="button"
              aria-label={isTr ? 'Nasıl bağlanır?' : 'How to connect'}
              title={isTr ? 'Nasıl bağlanır?' : 'How to connect'}
              onClick={() => setHelpFor(s.id as PlatformWithGuide)}
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--fg-mute)', width: 28, height: 28, borderRadius: 8,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <IconHelp size={14} stroke={2.2} />
            </button>
          )}
        </div>

        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-mute)', margin: 0 }}>
          {s.blurb[isTr ? 'tr' : 'en']}
        </p>

        {isOpen && (
          <SocialConnectForm
            social={s}
            locale={locale}
            onCancel={() => setOpenSocialForm(null)}
            onSubmit={(data) => connectSocial(s.id, data)}
          />
        )}

        {!isOpen && !s.comingSoon && (
          <div className="marketplace-actions">
            {connected ? (
              <button
                type="button"
                className="btn-ghost btn-small"
                onClick={() => disconnectSocial(s.id)}
              >
                <IconX size={13} stroke={2.4} />
                {isTr ? 'Bağlantıyı Kaldır' : 'Disconnect'}
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary btn-small"
                onClick={() => setOpenSocialForm(s.id)}
              >
                {isTr ? 'Bağla' : 'Connect'}
              </button>
            )}
          </div>
        )}
      </article>
    );
  })}
</div>
```

- [ ] **Step 5: Add the `SocialConnectForm` subcomponent**

At the bottom of the file (alongside `ConnectForm`), add:

```tsx
function SocialConnectForm({
  social,
  locale,
  onCancel,
  onSubmit,
}: {
  social: SocialDef;
  locale: string;
  onCancel: () => void;
  onSubmit: (data: SocialConnection) => void;
}) {
  const isTr = locale === 'tr';
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [token, setToken] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !handle || !token) return;
    const cleanHandle = handle.replace(/^@/, '');
    onSubmit({
      displayName,
      handle: cleanHandle,
      token,
      connectedAt: new Date().toISOString(),
    });
  };

  return (
    <form className="marketplace-form" onSubmit={submit}>
      <div>
        <label>{isTr ? 'Görünen ad' : 'Display name'}</label>
        <input
          type="text"
          required
          className="auth-input"
          placeholder={isTr ? 'örn. Ayşe Seramik' : 'e.g. Ayşe Ceramics'}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <label>{isTr ? `${social.name} kullanıcı adı` : `${social.name} username`}</label>
        <input
          type="text"
          required
          className="auth-input"
          placeholder="@kullanici_adi"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
      </div>
      <div>
        <label>{isTr ? 'Erişim anahtarı (token)' : 'Access token'}</label>
        <input
          type="password"
          required
          className="auth-input"
          placeholder={isTr ? 'Uzun-ömürlü token' : 'Long-lived token'}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button type="submit" className="btn-primary btn-small">
          {isTr ? 'Doğrula & Bağla' : 'Verify & Connect'}
        </button>
        <button type="button" className="btn-ghost btn-small" onClick={onCancel}>
          {isTr ? 'İptal' : 'Cancel'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Smoke test**

```bash
npm run dev
```

Visit `/tr/dashboard/settings`. Scroll down — see "Sosyal Hesaplar" with Instagram (active), Twitter (Soon), Facebook (Soon). Click `?` on Instagram → modal opens. Click "Bağla" → form appears. Fill it and submit → green toast.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/\(dashboard\)/dashboard/settings/SettingsClient.tsx
git commit -m "feat(settings): Instagram + soon-cards in Social Accounts grid"
```

---

### Task 12: Reflect connected IG handle in Social page

**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/social/SocialClient.tsx`

- [ ] **Step 1: Read socials in `SocialClient`**

At the top of the function body, after `const isTr = locale === 'tr';`, add:

```tsx
import { useConnections } from '@/lib/connections';
// (add the import at the top of the file along with other imports)
```

And inside the function:

```tsx
const { socials } = useConnections();
const igHandle = socials.instagram?.handle;
```

- [ ] **Step 2: Change `fakePost` message**

Replace the existing `fakePost` body:

```tsx
const fakePost = (platform: string) => {
  setPosting(true);
  setTimeout(() => {
    setPosting(false);
    const isIg = platform === 'Instagram';
    const igConnected = isIg && igHandle;
    notifications.show({
      color: 'green',
      title: `${platform} ✓`,
      message: igConnected
        ? (isTr
            ? `@${igHandle} adına paylaşıma hazır (gerçek API gelecek sürümde).`
            : `Ready to post as @${igHandle} (real API ships next).`)
        : (isTr
            ? `Paylaşıldı (demo). Gerçek API entegrasyonu Captain plan'da gelir.`
            : `Posted (demo). Real API integration ships in the Captain plan.`),
      autoClose: 4500,
    });
  }, 900);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/\(dashboard\)/dashboard/social/SocialClient.tsx
git commit -m "feat(social): reflect connected IG handle in share-button toast"
```

---

## Phase 4 — Real-mode gating

### Task 13: `ConnectionRequired` component

**Files:**
- Create: `src/components/ConnectionRequired.tsx`

- [ ] **Step 1: Implement**

Create `src/components/ConnectionRequired.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { IconLink, IconArrowRight } from '@tabler/icons-react';

export function ConnectionRequired({
  feature,
  platforms,
}: {
  feature: string;          // e.g. "Ürünler" / "Products"
  platforms?: string[];     // e.g. ["Shopify"] — informational only
}) {
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'tr';
  const isTr = locale === 'tr';

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '60px auto',
        padding: 28,
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 14,
      }}
    >
      <span
        style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'color-mix(in srgb, var(--c-amber) 14%, transparent)',
          color: 'var(--c-amber)',
          border: '1px solid var(--border)',
        }}
      >
        <IconLink size={18} stroke={2} />
      </span>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
        {isTr ? `${feature} için bir mağaza bağlamalısın` : `${feature} needs a connected store`}
      </h2>
      <p style={{ margin: 0, color: 'var(--fg-mute)', fontSize: 14, lineHeight: 1.55 }}>
        {isTr
          ? 'Gerçek modda bu sayfa için en az bir mağaza bağlı olmalı. Demo modunu da seçebilirsin — örnek veriyle çalışır.'
          : 'Real mode requires at least one connected store. You can switch to Demo mode to use seeded data.'}
        {platforms && platforms.length > 0 && (
          <>
            {' '}
            <strong style={{ color: 'var(--fg)' }}>
              {isTr ? 'Önerilen: ' : 'Recommended: '}
              {platforms.join(', ')}
            </strong>
          </>
        )}
      </p>
      <Link href={`/${locale}/dashboard/settings`} className="btn-primary btn-small">
        {isTr ? 'Ayarlara Git' : 'Open Settings'}
        <IconArrowRight size={13} stroke={2.4} />
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ConnectionRequired.tsx
git commit -m "feat(ui): ConnectionRequired gate component"
```

---

### Task 14: Gate dashboard pages in real mode

**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/products/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/dashboard/cashflow/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/dashboard/reviews/page.tsx`

- [ ] **Step 1: Read the current pages**

Skim each of the three page files so you understand their data-fetching shape. They are server components that render a client subtree.

- [ ] **Step 2: Create the client-side gate component**

Connections live in `localStorage` (client-only), so gating must happen in a client component that wraps the page body. Create `src/components/RealModeGate.tsx`:

```tsx
'use client';

import { type ReactNode } from 'react';
import { useAppMode } from './AppModeProvider';
import { useConnections } from '@/lib/connections';
import { ConnectionRequired } from './ConnectionRequired';

export function RealModeGate({
  feature,
  platforms,
  children,
}: {
  feature: string;
  platforms?: string[];
  children: ReactNode;
}) {
  const { mode } = useAppMode();
  const { hasAnyMarketplace } = useConnections();
  if (mode === 'real' && !hasAnyMarketplace) {
    return <ConnectionRequired feature={feature} platforms={platforms} />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 3: Use the gate on each page**

For `src/app/[locale]/(dashboard)/dashboard/products/page.tsx`, wrap the rendered output. Example shape:

```tsx
import { RealModeGate } from '@/components/RealModeGate';

export default async function ProductsPage(/* …existing args */) {
  // …existing data fetching…
  return (
    <RealModeGate feature={locale === 'tr' ? 'Ürünler' : 'Products'} platforms={['Shopify', 'Trendyol']}>
      {/* existing JSX */}
    </RealModeGate>
  );
}
```

Do the same for `cashflow/page.tsx` with `feature: 'Nakit Akışı' / 'Cash Flow'` and platforms `['Shopify']`, and `reviews/page.tsx` with `'Yorumlar' / 'Reviews'` and platforms `['Trendyol', 'Hepsiburada', 'Etsy']`.

- [ ] **Step 4: Smoke test**

```bash
npm run dev
```

Toggle the mode to Real (with no store connected). Visit `/tr/dashboard/products`, `/cashflow`, `/reviews` — each shows the `ConnectionRequired` card. Switch back to Demo — full pages return.

- [ ] **Step 5: Commit**

```bash
git add src/components/RealModeGate.tsx \
        src/app/[locale]/\(dashboard\)/dashboard/products/page.tsx \
        src/app/[locale]/\(dashboard\)/dashboard/cashflow/page.tsx \
        src/app/[locale]/\(dashboard\)/dashboard/reviews/page.tsx
git commit -m "feat(dashboard): real-mode gating on products/cashflow/reviews"
```

---

## Phase 5 — Landing → Sign-up routing

### Task 15: Strip prompt-save behaviour

**Files:**
- Modify: `src/components/landing/ChatInput.tsx`
- Modify: `src/components/landing/Hero.tsx`
- Modify: `src/app/[locale]/(auth)/login/page.tsx`

- [ ] **Step 1: Edit `ChatInput.tsx`**

Rename `signinHref` → `signupHref` and strip the query:

Find:

```tsx
interface ChatInputProps {
  placeholder: string;
  modes: string[];
  signinHref: string;
  rotatingPlaceholders?: string[];
}
```

Replace with:

```tsx
interface ChatInputProps {
  placeholder: string;
  modes: string[];
  signupHref: string;
  rotatingPlaceholders?: string[];
}
```

Then update the function signature and the `submit` body. Find:

```tsx
export function ChatInput({
  placeholder,
  modes,
  signinHref,
  rotatingPlaceholders,
}: ChatInputProps) {
```

Replace with:

```tsx
export function ChatInput({
  placeholder,
  modes,
  signupHref,
  rotatingPlaceholders,
}: ChatInputProps) {
```

Find:

```tsx
const submit = () => {
  const q = value.trim();
  const target = q ? `${signinHref}?q=${encodeURIComponent(q)}` : signinHref;
  router.push(target);
};
```

Replace with:

```tsx
const submit = () => {
  router.push(signupHref);
};
```

- [ ] **Step 2: Edit `Hero.tsx`**

Find:

```tsx
<ChatInput
  placeholder={copy.chatPlaceholder}
  modes={copy.chatModes}
  signinHref={loginHref}
  rotatingPlaceholders={copy.chatRotating}
/>
```

Replace with:

```tsx
<ChatInput
  placeholder={copy.chatPlaceholder}
  modes={copy.chatModes}
  signupHref={signupHref}
  rotatingPlaceholders={copy.chatRotating}
/>
```

- [ ] **Step 3: Strip `seedQuery` from login page**

In `src/app/[locale]/(auth)/login/page.tsx`, remove the `useSearchParams` import, remove the `const search = useSearchParams();` line, remove the `seedQuery` constant, and remove the `useEffect` that shows the "Sorgun kaydedildi" notification. The file should no longer reference `useSearchParams`, `seedQuery`, or `useEffect` (unless `useEffect` is still needed elsewhere — it isn't in this file).

- [ ] **Step 4: Write the E2E**

Create `tests/e2e/landing-to-signup.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('landing chat input routes to /signup with no query', async ({ page }) => {
  await page.goto('/tr');
  await page.fill('textarea.chat-textarea', 'Bana Instagram postu yaz');
  await page.click('button.chat-send.is-primary');
  await expect(page).toHaveURL(/\/tr\/signup$/);
});
```

- [ ] **Step 5: Run the E2E**

```bash
npx playwright test tests/e2e/landing-to-signup.spec.ts
```

Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add src/components/landing/ChatInput.tsx src/components/landing/Hero.tsx \
        src/app/[locale]/\(auth\)/login/page.tsx \
        tests/e2e/landing-to-signup.spec.ts
git commit -m "feat(landing): chat input goes straight to /signup, no saved query"
```

---

## Phase 6 — Sign-up centered layout

### Task 16: Split auth layouts

**Files:**
- Modify: `src/app/[locale]/(auth)/layout.tsx`
- Create: `src/app/[locale]/(auth)/login/layout.tsx`
- Create: `src/app/[locale]/(auth)/signup/layout.tsx`

- [ ] **Step 1: Slim the parent `(auth)/layout.tsx`**

Replace the whole file with:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Move the existing shell to `login/layout.tsx`**

Create `src/app/[locale]/(auth)/login/layout.tsx` with the previous two-column shell:

```tsx
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconAnchor } from '@tabler/icons-react';

export default function LoginAuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth');
  return (
    <div className="auth-root">
      <div className="hero-blob" style={{ position: 'fixed', opacity: 0.7 }} />
      <div className="noise-overlay" style={{ position: 'fixed' }} />

      <aside className="auth-aside">
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--fg)',
            textDecoration: 'none',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span className="brand-mark">
            <IconAnchor size={17} stroke={2.4} />
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>
            KOBİ Kaptanı
          </span>
        </Link>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1
            className="landing-display"
            style={{
              fontSize: 'clamp(2.6rem, 4.5vw, 3.6rem)',
              lineHeight: 1.02,
              margin: 0,
            }}
          >
            <em>Beş</em>{' '}
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '-0.04em' }}>
              asistan,<br />bir kaptan.
            </span>
          </h1>
          <p
            style={{
              marginTop: 18,
              maxWidth: 360,
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--fg-mute)',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{t('tagline')}&rdquo;
          </p>
        </div>

        <p style={{ fontSize: 13, color: 'var(--fg-dim)', position: 'relative', zIndex: 2 }}>
          © 2026 KOBİ Kaptanı · Gemini AI Hackathon
        </p>
      </aside>

      <main className="auth-main">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create the centered `signup/layout.tsx`**

Create `src/app/[locale]/(auth)/signup/layout.tsx`:

```tsx
import Link from 'next/link';
import { IconAnchor } from '@tabler/icons-react';

export default function SignupAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 20px',
        background: 'var(--bg)',
      }}
    >
      <div className="hero-blob" style={{ position: 'fixed', opacity: 0.7 }} />
      <div className="noise-overlay" style={{ position: 'fixed' }} />

      <Link
        href="/"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--fg)',
          textDecoration: 'none',
          zIndex: 2,
        }}
      >
        <span className="brand-mark">
          <IconAnchor size={17} stroke={2.4} />
        </span>
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>
          KOBİ Kaptanı
        </span>
      </Link>

      <main
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 440,
        }}
      >
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Smoke test both routes**

```bash
npm run dev
```

Visit `/tr/signup` — full-screen centered card, no left aside. Visit `/tr/login` — unchanged two-column layout.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/\(auth\)/layout.tsx \
        src/app/[locale]/\(auth\)/login/layout.tsx \
        src/app/[locale]/\(auth\)/signup/layout.tsx
git commit -m "feat(auth): signup gets centered shell, login keeps two-column"
```

---

## Phase 7 — Captain streaming + better errors

### Task 17: Emit incremental events from `/api/agent`

**Files:**
- Modify: `src/app/api/agent/route.ts`
- Modify: `src/agents/captain.ts`

- [ ] **Step 1: Inspect Genkit's per-tool hook**

Open `src/agents/captain.ts` and notice it uses `ai.generate(...)` directly with `tools: [...]`. Genkit's `generate` accepts an `onChunk` / `streamingCallback` parameter (depending on version). For our version, we want a callback that fires when the model decides to call a tool. We'll add a wrapper.

- [ ] **Step 2: Update `captainAgent` to accept a callback**

Replace the existing `captainAgent` definition in `src/agents/captain.ts` with the version below. (The system prompt block stays identical; only the flow body changes.)

```ts
export interface CaptainCallbacks {
  onToolCall?: (tool: string) => void;
}

export const captainAgent = ai.defineFlow(
  {
    name: 'captainAgent',
    inputSchema: z.object({
      query: z.string(),
      userLanguage: z.string().default('tr'),
    }),
    outputSchema: CaptainBriefSchema,
  },
  async ({ query, userLanguage }) => {
    const { output } = await ai.generate({
      model: proModel,
      system: CAPTAIN_SYSTEM_PROMPT,
      prompt: `Kullanıcı dili: ${userLanguage}\nSoru: ${query}`,
      tools: [runSeoTool, runMarketingTool, runPricingTool, listProductsTool, getProductTool],
      output: { schema: CaptainBriefSchema },
    });

    if (!output) throw new Error('Captain returned no output');
    return output;
  }
);

// New: wrapper that accepts callbacks the API route uses to forward progress events.
export async function runCaptainWithCallbacks(
  input: { query: string; userLanguage: string },
  callbacks: CaptainCallbacks,
): Promise<z.infer<typeof CaptainBriefSchema>> {
  const TOOL_TO_HUMAN: Record<string, string> = {
    runSeoAgent: 'SEO ajanı',
    runMarketingAgent: 'Pazarlama ajanı',
    runPricingAgent: 'Fiyat ajanı',
    listProducts: 'Ürün listesi',
    getProduct: 'Ürün detayı',
  };

  const { output } = await ai.generate({
    model: proModel,
    system: CAPTAIN_SYSTEM_PROMPT,
    prompt: `Kullanıcı dili: ${input.userLanguage}\nSoru: ${input.query}`,
    tools: [runSeoTool, runMarketingTool, runPricingTool, listProductsTool, getProductTool],
    output: { schema: CaptainBriefSchema },
    onChunk: (chunk: { toolRequests?: Array<{ name: string }> }) => {
      const calls = chunk.toolRequests ?? [];
      for (const call of calls) {
        const human = TOOL_TO_HUMAN[call.name] ?? call.name;
        callbacks.onToolCall?.(human);
      }
    },
  });

  if (!output) throw new Error('Captain returned no output');
  return output;
}
```

> **Compatibility note for the engineer:** If your Genkit version doesn't accept `onChunk` in `generate`, fall back to `ai.generateStream(...)` and iterate `response.stream` — the surface is similar, the wrapper signature stays the same.

- [ ] **Step 3: Rewrite `/api/agent/route.ts` to stream events**

Replace `src/app/api/agent/route.ts` entirely with:

```ts
import { createClient } from '@/lib/supabase/server';
import { runCaptainWithCallbacks } from '@/agents/captain';
import { getAppMode } from '@/lib/app-mode';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

type ErrorCode =
  | 'gemini_unauthorized'
  | 'gemini_quota'
  | 'no_tools_called'
  | 'unknown';

function classifyError(err: unknown): { code: ErrorCode; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  const low = message.toLowerCase();
  if (low.includes('unauthorized') || low.includes('api key') || low.includes('401')) {
    return { code: 'gemini_unauthorized', message: 'Gemini API anahtarı eksik veya hatalı.' };
  }
  if (low.includes('quota') || low.includes('429')) {
    return { code: 'gemini_quota', message: 'Gemini kotası doldu — biraz bekle ve tekrar dene.' };
  }
  if (low.includes('returned no output')) {
    return { code: 'no_tools_called', message: 'Kaptan bir cevap üretemedi — soruyu farklı ifade et.' };
  }
  return { code: 'unknown', message };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { query, locale, conversationId: incomingConversationId } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      try {
        const mode = await getAppMode(supabase);

        // 1) Ensure a conversation exists; create one if not provided.
        let conversationId = incomingConversationId as string | undefined;
        if (!conversationId) {
          const { data: convo, error: convoErr } = await supabase
            .from('conversations')
            .insert({ profile_id: user.id, title: query.slice(0, 40) })
            .select('id')
            .single();
          if (convoErr || !convo) throw new Error(convoErr?.message ?? 'conversation create failed');
          conversationId = convo.id;
          emit({ type: 'conversation_created', conversationId });
        }

        // 2) Persist the user message.
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          text: query,
        });

        // 3) Initial thinking ping so the UI updates within ~50ms.
        emit({ type: 'thinking', stage: 'planning' });

        // 4) Run the captain with tool-call callbacks → forward each as a 'thinking' event.
        const startTime = Date.now();
        const result = await runCaptainWithCallbacks(
          { query, userLanguage: locale ?? 'tr' },
          {
            onToolCall: (toolHuman) => {
              emit({ type: 'thinking', stage: 'tool_call', tool: toolHuman });
            },
          },
        );
        const durationMs = Date.now() - startTime;

        // 5) Persist trace + captain message.
        const captainText = `${result.greeting}\n\n${result.topPriority ?? ''}`.trim();
        await Promise.all([
          supabase.from('agent_traces').insert({
            profile_id: user.id,
            query,
            trace_json: { ...(result as unknown as Record<string, unknown>), mode },
            duration_ms: durationMs,
          }),
          supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'captain',
            text: captainText,
            brief_json: result as unknown as Record<string, unknown>,
          }),
          supabase.from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId),
        ]);

        emit({ type: 'final', conversationId, data: result });
        controller.close();
      } catch (err) {
        const { code, message } = classifyError(err);
        emit({ type: 'error', code, message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If Genkit's `onChunk` typing is different from the comment above, fix the local signature accordingly.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/agent/route.ts src/agents/captain.ts
git commit -m "feat(captain): streamed thinking/error events + conversation persistence in /api/agent"
```

---

### Task 18: Render thinking + better errors in `ChatPanel`

**Files:**
- Modify: `src/components/ChatPanel.tsx`

- [ ] **Step 1: Add a `thinkingLabel` state**

Inside `ChatPanel`, alongside the other `useState` calls, add:

```tsx
const [thinkingLabel, setThinkingLabel] = useState<string | null>(null);
```

- [ ] **Step 2: Parse all event types in `send`**

Replace the existing `for (const line of lines) { ... }` loop body in `send` with:

```tsx
for (const line of lines) {
  if (!line.trim()) continue;
  const event = JSON.parse(line);
  if (event.type === 'conversation_created') {
    // Surface to parent if needed; ignored at panel level.
  } else if (event.type === 'thinking') {
    if (event.stage === 'planning') {
      setThinkingLabel(locale === 'tr' ? 'Plan yapılıyor…' : 'Planning…');
    } else if (event.stage === 'tool_call' && event.tool) {
      setThinkingLabel(
        locale === 'tr'
          ? `${event.tool} çağrılıyor…`
          : `Calling ${event.tool}…`,
      );
    }
  } else if (event.type === 'final') {
    setThinkingLabel(null);
    setMessages(prev => [
      ...prev,
      {
        role: 'captain',
        text: event.data.greeting + '\n\n' + (event.data.topPriority ?? ''),
        brief: event.data,
      },
    ]);
  } else if (event.type === 'error') {
    setThinkingLabel(null);
    notifications.show({
      color: 'red',
      title: locale === 'tr' ? 'Kaptan hata verdi' : 'Captain error',
      message: event.message,
      autoClose: 6000,
    });
  }
}
```

- [ ] **Step 3: Reset `thinkingLabel` on errors and unmount**

Inside the `catch` block of `send`, add `setThinkingLabel(null);` as the first line.

- [ ] **Step 4: Update `ThinkingIndicator` to accept a label prop**

Replace the existing `ThinkingIndicator` definition:

```tsx
function ThinkingIndicator({ label }: { label?: string | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <AgentChip agent="captain" />
      <div className="thinking-dots">
        <span /><span /><span />
      </div>
      <span style={{ fontSize: 13.5, color: 'var(--fg-mute)' }}>
        {label ?? 'Ajanlar düşünüyor…'}
      </span>
    </div>
  );
}
```

And in the JSX, change `{pending && <ThinkingIndicator />}` to `{pending && <ThinkingIndicator label={thinkingLabel} />}`.

- [ ] **Step 5: Smoke test the streamed UI**

```bash
npm run dev
```

Send a question in the chat. Within ~1–2 s you should see "Plan yapılıyor…", then "<tool> çağrılıyor…" labels updating, then the final message. On a forced error (e.g., unset Gemini key) the toast text reads the specific error message.

- [ ] **Step 6: Commit**

```bash
git add src/components/ChatPanel.tsx
git commit -m "feat(chat): render incremental thinking labels + specific error messages"
```

---

## Phase 8 — Captain chat history

### Task 19: `GET /api/conversations`

**Files:**
- Create: `src/app/api/conversations/route.ts`

- [ ] **Step 1: Implement**

Create `src/app/api/conversations/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, updated_at, created_at')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ conversations: data ?? [] });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/conversations/route.ts
git commit -m "feat(api): GET /api/conversations lists current user's chats"
```

---

### Task 20: `PATCH` and `DELETE /api/conversations/[id]`

**Files:**
- Create: `src/app/api/conversations/[id]/route.ts`

- [ ] **Step 1: Implement**

Create `src/app/api/conversations/[id]/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as { title?: string };
  if (!body.title || body.title.trim().length === 0) {
    return Response.json({ error: 'title_required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('conversations')
    .update({ title: body.title.trim() })
    .eq('id', id)
    .eq('profile_id', user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/conversations/[id]/route.ts
git commit -m "feat(api): PATCH (rename) and DELETE /api/conversations/[id]"
```

---

### Task 21: `ChatList` rail component

**Files:**
- Create: `src/components/chat/ChatList.tsx`

- [ ] **Step 1: Implement**

Create `src/components/chat/ChatList.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import {
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconPlus,
} from '@tabler/icons-react';
import { Menu } from '@mantine/core';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

function timeAgo(iso: string, isTr: boolean): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1)   return isTr ? 'şimdi' : 'now';
  if (m < 60)  return isTr ? `${m} dk önce` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return isTr ? `${h} saat önce` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return isTr ? `${d} gün önce` : `${d}d ago`;
}

export function ChatList({ activeId }: { activeId?: string }) {
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'tr';
  const isTr = locale === 'tr';
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const refresh = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) return;
      const json = (await res.json()) as { conversations: Conversation[] };
      setConversations(json.conversations);
    } catch {
      /* ignore */
    }
  };

  // Re-fetch whenever the active conversation changes (likely a new one was created
  // by /api/agent or the URL moved).
  useEffect(() => {
    refresh();
  }, [pathname]);

  const commitRename = async (id: string) => {
    const title = renameValue.trim();
    if (!title) { setRenamingId(null); return; }
    setConversations(c => c?.map(x => x.id === id ? { ...x, title } : x) ?? null);
    setRenamingId(null);
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      notifications.show({ color: 'red', message: isTr ? 'Yeniden adlandırma başarısız' : 'Rename failed' });
      refresh();
    }
  };

  const removeConversation = async (id: string) => {
    if (!confirm(isTr ? 'Bu sohbeti silmek istediğinden emin misin?' : 'Delete this conversation?')) return;
    setConversations(c => c?.filter(x => x.id !== id) ?? null);
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      notifications.show({ color: 'red', message: isTr ? 'Silinemedi' : 'Delete failed' });
      refresh();
      return;
    }
    if (id === activeId) {
      router.push(`/${locale}/dashboard/chat`);
    }
  };

  return (
    <aside
      style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: 12,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <Link
        href={`/${locale}/dashboard/chat`}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 10,
          color: 'var(--fg)', textDecoration: 'none',
          fontSize: 13.5, fontWeight: 500,
          border: '1px dashed var(--border)',
          marginBottom: 8,
        }}
      >
        <IconPlus size={14} stroke={2.4} />
        {isTr ? 'Yeni sohbet' : 'New chat'}
      </Link>

      {conversations === null && (
        <p style={{ fontSize: 12.5, color: 'var(--fg-dim)', padding: '8px 12px' }}>
          {isTr ? 'Yükleniyor…' : 'Loading…'}
        </p>
      )}

      {conversations?.length === 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--fg-dim)', padding: '8px 12px' }}>
          {isTr ? 'Henüz sohbet yok.' : 'No conversations yet.'}
        </p>
      )}

      {conversations?.map((c) => {
        const isActive = c.id === activeId;
        if (renamingId === c.id) {
          return (
            <form
              key={c.id}
              onSubmit={(e) => { e.preventDefault(); commitRename(c.id); }}
              style={{ padding: '6px 8px' }}
            >
              <input
                autoFocus
                className="auth-input"
                style={{ fontSize: 13, padding: '6px 8px' }}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(c.id)}
              />
            </form>
          );
        }
        return (
          <div
            key={c.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 4px 6px 12px',
              borderRadius: 10,
              background: isActive ? 'color-mix(in srgb, var(--c-emerald) 8%, transparent)' : 'transparent',
              border: isActive ? '1px solid color-mix(in srgb, var(--c-emerald) 30%, var(--border))' : '1px solid transparent',
            }}
          >
            <Link
              href={`/${locale}/dashboard/chat/${c.id}`}
              style={{
                flex: 1, minWidth: 0,
                color: 'var(--fg)', textDecoration: 'none',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 13, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
                title={c.title}
              >
                {c.title}
              </span>
              <span style={{ fontSize: 11, color: 'var(--fg-dim)' }}>
                {timeAgo(c.updated_at, isTr)}
              </span>
            </Link>
            <Menu shadow="md" position="bottom-end" withinPortal>
              <Menu.Target>
                <button
                  type="button"
                  aria-label={isTr ? 'Seçenekler' : 'Options'}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--fg-mute)',
                    width: 24, height: 24, borderRadius: 6,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <IconDotsVertical size={14} stroke={2} />
                </button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconPencil size={13} />}
                  onClick={() => { setRenamingId(c.id); setRenameValue(c.title); }}
                >
                  {isTr ? 'Yeniden adlandır' : 'Rename'}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrash size={13} />}
                  color="red"
                  onClick={() => removeConversation(c.id)}
                >
                  {isTr ? 'Sil' : 'Delete'}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        );
      })}
    </aside>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ChatList.tsx
git commit -m "feat(chat): ChatList rail with rename / delete / new"
```

---

### Task 22: `ChatPanel` accepts `initialMessages` + `conversationId`

**Files:**
- Modify: `src/components/ChatPanel.tsx`

> This task ships **before** Task 23 because the new page files in Task 23 import `InitialMessage` from `ChatPanel` — that export only exists after this task.

- [ ] **Step 1: Export `Message` (renamed `InitialMessage` for clarity)**

At the top of `ChatPanel.tsx`, replace:

```tsx
interface Message {
  role: 'user' | 'captain';
  text: string;
  brief?: CaptainBrief;
}
```

with:

```tsx
export interface InitialMessage {
  role: 'user' | 'captain';
  text: string;
  brief?: CaptainBrief;
}
type Message = InitialMessage;
```

- [ ] **Step 2: Update the function signature**

Replace:

```tsx
export function ChatPanel({ locale }: { locale: string }) {
```

with:

```tsx
export function ChatPanel({
  locale,
  conversationId: initialConversationId,
  initialMessages,
}: {
  locale: string;
  conversationId?: string;
  initialMessages?: InitialMessage[];
}) {
```

- [ ] **Step 3: Hydrate state from props**

Replace:

```tsx
const [messages, setMessages] = useState<Message[]>([]);
```

with:

```tsx
const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
```

(No `useRouter` import needed — see Step 4.)

- [ ] **Step 4: Pass `conversationId` to the API and update URL on create**

In the `send` function, replace the existing `body: JSON.stringify({ query: q, locale })` with:

```ts
body: JSON.stringify({ query: q, locale, conversationId }),
```

In the `for (const line of lines)` loop, extend the `conversation_created` branch (currently a no-op comment) to:

```tsx
} else if (event.type === 'conversation_created') {
  setConversationId(event.conversationId);
  // Shallow URL swap — keeps this ChatPanel mounted so the in-flight stream
  // doesn't get interrupted. Next.js routing kicks in only on the next nav/reload.
  if (typeof window !== 'undefined') {
    window.history.replaceState(
      null,
      '',
      `/${locale}/dashboard/chat/${event.conversationId}`,
    );
  }
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ChatPanel.tsx
git commit -m "feat(chat): hydrate ChatPanel from initialMessages + propagate conversationId"
```

---

### Task 23: `chat/[id]/page.tsx` + `chat/page.tsx` updates

**Files:**
- Create: `src/app/[locale]/(dashboard)/dashboard/chat/[id]/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/dashboard/chat/page.tsx`

- [ ] **Step 1: Create the `[id]` page**

Create `src/app/[locale]/(dashboard)/dashboard/chat/[id]/page.tsx`:

```tsx
import { redirect, notFound } from 'next/navigation';
import { ChatPanel, type InitialMessage } from '@/components/ChatPanel';
import { ChatList } from '@/components/chat/ChatList';
import { A2AGraph } from '@/components/A2AGraph';
import { createClient } from '@/lib/supabase/server';
import { IconRoute2 } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function ChatByIdPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: convo } = await supabase
    .from('conversations')
    .select('id, title')
    .eq('id', id)
    .single();
  if (!convo) notFound();

  const { data: rows } = await supabase
    .from('messages')
    .select('role, text, brief_json')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  const initial: InitialMessage[] = (rows ?? []).map((r) => ({
    role: r.role as 'user' | 'captain',
    text: r.text,
    brief: (r.brief_json as InitialMessage['brief']) ?? undefined,
  }));

  return (
    <div
      className="chat-page"
      style={{
        display: 'grid',
        gridTemplateColumns: '240px minmax(0, 2.1fr) minmax(280px, 1fr)',
        gap: 20,
        height: 'calc(100vh - 8rem)',
        margin: '-1rem -0.5rem',
      }}
    >
      <ChatList activeId={id} />

      <section
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className="brand-mark" style={{ width: 26, height: 26, borderRadius: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 14, color: 'white' }}>K</span>
          </span>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--fg)' }}>
            {convo.title}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ChatPanel locale={locale} conversationId={id} initialMessages={initial} />
        </div>
      </section>

      <aside
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 20,
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'color-mix(in srgb, var(--c-emerald) 12%, transparent)',
              color: 'var(--c-emerald)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)',
            }}
          >
            <IconRoute2 size={15} stroke={2} />
          </span>
          <span className="section-eyebrow" style={{ margin: 0, color: 'var(--c-amber)' }}>
            {locale === 'tr' ? 'Canlı Trace' : 'Live Trace'}
          </span>
        </div>
        <A2AGraph locale={locale} />
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Update `chat/page.tsx` to use the same grid + a "new chat" panel**

Replace `src/app/[locale]/(dashboard)/dashboard/chat/page.tsx` with:

```tsx
import { ChatPanel } from '@/components/ChatPanel';
import { ChatList } from '@/components/chat/ChatList';
import { A2AGraph } from '@/components/A2AGraph';
import { IconRoute2 } from '@tabler/icons-react';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div
      className="chat-page"
      style={{
        display: 'grid',
        gridTemplateColumns: '240px minmax(0, 2.1fr) minmax(280px, 1fr)',
        gap: 20,
        height: 'calc(100vh - 8rem)',
        margin: '-1rem -0.5rem',
      }}
    >
      <ChatList />

      <section
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className="brand-mark" style={{ width: 26, height: 26, borderRadius: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 14, color: 'white' }}>K</span>
          </span>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--fg)' }}>
            {locale === 'tr' ? 'Kaptan ile Sohbet' : 'Chat with the Captain'}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ChatPanel locale={locale} />
        </div>
      </section>

      <aside
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 20,
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'color-mix(in srgb, var(--c-emerald) 12%, transparent)',
              color: 'var(--c-emerald)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)',
            }}
          >
            <IconRoute2 size={15} stroke={2} />
          </span>
          <span className="section-eyebrow" style={{ margin: 0, color: 'var(--c-amber)' }}>
            {locale === 'tr' ? 'Canlı Trace' : 'Live Trace'}
          </span>
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-mute)', margin: 0 }}>
          {locale === 'tr'
            ? "Sorunu gönder, Kaptan'ın hangi uzmanları çağırdığı ve neyi sorduğu burada adım adım görünür."
            : "Send a query — you'll see which specialists the Captain calls and what it asks, step by step."}
        </p>
        <div className="soft-divider" style={{ margin: '18px 0 8px' }} />
        <A2AGraph locale={locale} />
      </aside>
    </div>
  );
}
```

- [ ] **Step 3: Smoke test the integration of Tasks 22 + 23**

```bash
npm run dev
```

1. Visit `/tr/dashboard/chat` → send a message. URL updates to `/tr/dashboard/chat/<uuid>` (shallow swap) and a list entry appears on the left.
2. Reload the page — messages persist; the title in the header reflects the conversation.
3. Click "Yeni sohbet" → fresh empty panel on `/tr/dashboard/chat`.
4. Open the `…` menu on a row in the list → Rename works inline; Delete confirms and removes the row.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/\(dashboard\)/dashboard/chat
git commit -m "feat(chat): 3-column grid (list/conversation/trace) on /chat and /chat/[id]"
```

---

### Task 24: E2E for chat history

**Files:**
- Create: `tests/e2e/chat-history.spec.ts`

- [ ] **Step 1: Write the test**

Create `tests/e2e/chat-history.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('chat history', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tr/login');
    await page.fill('input[name="email"]', 'ayse@seramik.com');
    await page.fill('input[name="password"]', 'AyseDemo2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/tr\/dashboard/, { timeout: 20000 });
  });

  test('sending a message creates a conversation that survives reload', async ({ page }) => {
    await page.goto('/tr/dashboard/chat');

    const composer = page.locator('textarea.chat-textarea');
    await composer.fill('Tüm ürünlerimi listele');
    await page.click('button.chat-send.is-primary');

    // URL should update to /chat/<uuid> within a few seconds (right after the
    // 'conversation_created' event fires).
    await expect(page).toHaveURL(/\/tr\/dashboard\/chat\/[0-9a-f-]{36}$/, { timeout: 30_000 });

    const url = page.url();
    await page.reload();

    await expect(page).toHaveURL(url);
    await expect(page.locator('text=Tüm ürünlerimi listele').first()).toBeVisible();
  });
});
```

- [ ] **Step 2: Run**

```bash
npx playwright test tests/e2e/chat-history.spec.ts
```

Expected: 1 passed. (If Gemini takes >30s for the final reply that's still OK — the assertion fires when the URL changes, not when the captain finishes.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/chat-history.spec.ts
git commit -m "test(e2e): chat-history persistence"
```

---

## Final tasks — Cleanup & verification

### Task 25: Full type-check + E2E sweep

- [ ] **Step 1: Type-check the whole project**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run all unit tests**

```bash
npm test
```

Expected: all pre-existing tests still pass + the new `app-mode.test.ts` and `connect-guides.test.ts`.

- [ ] **Step 3: Run the full E2E suite**

```bash
npm run test:e2e
```

Expected: pre-existing tests pass + the new `landing-to-signup.spec.ts` and `chat-history.spec.ts` pass. If the pre-existing `tests/e2e/chat.spec.ts` was broken before our changes (e.g., selector mismatch on `textarea` vs `input`), note it as out-of-scope.

- [ ] **Step 4: Manual smoke checklist** (mirrors the spec's §8)

Run the dev server and verify each line:

1. Settings page shows the **Çalışma Modu** card. Toggling to Real with no connection shows a red toast and reverts.
2. Connect a marketplace → toggle to Real succeeds. `/dashboard/products`, `/cashflow`, `/reviews` render their normal content.
3. Disconnect all marketplaces while in Real mode → the three pages now render `ConnectionRequired`.
4. Click `?` on every marketplace card and on the Instagram card → modal opens with the right content, copy buttons work, "Open admin" opens in a new tab.
5. Connect Instagram → on `/dashboard/social`, the Instagram share button's toast references `@yourhandle`.
6. From `/tr` (landing), type a query in the chat input and press send → lands on `/tr/signup` with no `?q=` and no toast on login.
7. `/tr/signup` is full-screen centered. `/tr/login` is unchanged two-column.
8. Send a chat query → see "Plan yapılıyor…" then "<tool> çağrılıyor…" within ~2 s. On error → toast text is specific (e.g., "Gemini API anahtarı eksik veya hatalı.").
9. After a reply, reload `/tr/dashboard/chat/<id>` → messages still there. Rename and delete from the list work.

- [ ] **Step 5: Final commit if any cleanup needed**

If you fixed anything during sweep:

```bash
git add -A
git commit -m "chore: cleanup after multi-feature pass verification"
```

---

## Acceptance Criteria

All nine items in **Final task — Step 4** pass on the live dev server.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Genkit's `onChunk` shape differs from the comment in Task 17 | Falls back to `ai.generateStream(...)`; the `runCaptainWithCallbacks` signature stays the same. If neither is available, the route still works — it just won't emit per-tool `thinking` events; only the initial `'planning'` ping. |
| Supabase migration ordering | The new file uses timestamp `20260519000001`, strictly after the existing `20260514...` migrations. |
| RLS gaps on new tables | Step 1 of Task 1 includes per-row RLS policies. The smoke test in Step 6 of Task 14 cross-checks by attempting a normal interaction as the demo user. |
| Pre-existing `tests/e2e/chat.spec.ts` selector may be stale | Out of scope. Note it in the PR if it fails so a follow-up can update its `input[placeholder*="Sor"]` to `textarea.chat-textarea`. |
