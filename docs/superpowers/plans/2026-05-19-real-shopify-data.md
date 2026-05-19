# Real Shopify Data Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In Real mode, the Products, Cashflow, and Today pages show live data from the user's connected Shopify store instead of seeded Supabase data.

**Architecture:** Marketplace connections move from browser `localStorage` to a `store_connections` DB table (written by server actions, read server-side). A parameterized Shopify data layer fetches products/orders with the connected store's credentials. The three server-component pages branch on `app_mode`: real mode + a Shopify connection → fetch & map Shopify data; otherwise → seeded Supabase data, with a fallback banner on fetch failure.

**Tech Stack:** Next.js 15 App Router (server components, server actions), Supabase (Postgres + RLS), Mantine 8, Shopify Admin REST API 2024-10, Vitest.

---

## File Structure

**Create:**
- `supabase/migrations/20260519000002_store_connections.sql` — the `store_connections` table + RLS.
- `src/lib/shopify-map.ts` — Shopify payload types + pure mapping helpers (testable, no I/O).
- `src/lib/store-connections.ts` — server-side readers for `store_connections`.
- `src/components/StoreConnectionsProvider.tsx` — client provider + `useStoreConnections` hook.
- `src/components/SourceErrorBanner.tsx` — dismissible "couldn't reach Shopify" banner.
- `tests/unit/shopify-map.test.ts` — unit tests for the mapping helpers.

**Modify:**
- `src/lib/shopify.ts` — parameterize `fetchShopifyProducts`, add `fetchShopifyOrders`, drop env usage.
- `src/app/[locale]/(dashboard)/dashboard/settings/actions.ts` — add `saveStoreConnection` / `removeStoreConnection`.
- `src/app/[locale]/(dashboard)/layout.tsx` — read connections, wrap `StoreConnectionsProvider`.
- `src/app/[locale]/(dashboard)/dashboard/settings/SettingsClient.tsx` — use `useStoreConnections` for marketplaces.
- `src/components/RealModeGate.tsx` — use `useStoreConnections`.
- `src/agents/tools/cashflow-compute.ts` — accept an optional injected `salesHistory`.
- `src/app/[locale]/(dashboard)/dashboard/products/page.tsx` — real-mode wiring.
- `src/app/[locale]/(dashboard)/dashboard/cashflow/page.tsx` — real-mode wiring.
- `src/app/[locale]/(dashboard)/dashboard/page.tsx` — real-mode order count.

---

## Task 1: Database migration — `store_connections` table

**Files:**
- Create: `supabase/migrations/20260519000002_store_connections.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260519000002_store_connections.sql`:

```sql
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
```

- [ ] **Step 2: Apply the migration to the hosted project**

This repo has no linked Supabase CLI, so the migration must be applied by hand.
Ask the user to paste the SQL above into the Supabase Dashboard → SQL Editor → Run.

Verify it landed:

```bash
set -a; . ./.env.local; set +a
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/store_connections?select=id&limit=1" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
```

Expected: `[]` (empty array). A `PGRST205 "Could not find the table"` response means it was not applied yet — stop and have the user apply it.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260519000002_store_connections.sql
git commit -m "feat(db): store_connections table for per-user marketplace credentials"
```

---

## Task 2: Shopify mapping helpers + tests

**Files:**
- Create: `src/lib/shopify-map.ts`
- Test: `tests/unit/shopify-map.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/shopify-map.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  mapShopifyProduct,
  mapShopifyOrdersToSales,
  type ShopifyProduct,
  type ShopifyOrder,
} from '@/lib/shopify-map';

const product: ShopifyProduct = {
  id: 1,
  title: 'El Yapımı Mavi Vazo',
  body_html: '<p>desc</p>',
  vendor: 'Ayşe',
  product_type: 'vazo',
  tags: 'seramik',
  variants: [{ id: 11, price: '280.00', sku: 'V-1' }],
  images: [{ src: 'https://cdn.shopify.com/v.jpg' }],
};

describe('mapShopifyProduct', () => {
  it('maps a Shopify product to the ProductCard shape', () => {
    expect(mapShopifyProduct(product)).toEqual({
      name: 'El Yapımı Mavi Vazo',
      price: 280,
      category: 'vazo',
      channels: ['Shopify'],
      imageUrl: 'https://cdn.shopify.com/v.jpg',
    });
  });

  it('tolerates missing variant price, product_type and images', () => {
    const bare: ShopifyProduct = {
      ...product, product_type: '', variants: [], images: [],
    };
    const mapped = mapShopifyProduct(bare);
    expect(mapped.price).toBeNull();
    expect(mapped.category).toBeNull();
    expect(mapped.imageUrl).toBeUndefined();
  });
});

describe('mapShopifyOrdersToSales', () => {
  it('groups orders by day and sums total_price', () => {
    const orders: ShopifyOrder[] = [
      { id: 1, created_at: '2026-05-18T09:00:00Z', total_price: '100.50' },
      { id: 2, created_at: '2026-05-18T18:00:00Z', total_price: '49.50' },
      { id: 3, created_at: '2026-05-19T10:00:00Z', total_price: '200.00' },
    ];
    expect(mapShopifyOrdersToSales(orders)).toEqual([
      { date: '2026-05-18', revenue: 150 },
      { date: '2026-05-19', revenue: 200 },
    ]);
  });

  it('returns an empty array for no orders', () => {
    expect(mapShopifyOrdersToSales([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/shopify-map.test.ts`
Expected: FAIL — `Cannot find module '@/lib/shopify-map'`.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/shopify-map.ts`:

```ts
// Shopify Admin REST payload shapes (only the fields this app reads) and the
// pure helpers that map them onto the shapes the dashboard already consumes.

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  variants: { id: number; price: string; sku: string }[];
  images: { src: string }[];
}

export interface ShopifyOrder {
  id: number;
  created_at: string;
  total_price: string;
}

export interface MappedProduct {
  name: string;
  price: number | null;
  category: string | null;
  channels: string[];
  imageUrl?: string;
}

export function mapShopifyProduct(p: ShopifyProduct): MappedProduct {
  const raw = p.variants[0]?.price;
  const price = raw != null ? Number.parseFloat(raw) : Number.NaN;
  return {
    name: p.title,
    price: Number.isFinite(price) ? price : null,
    category: p.product_type || null,
    channels: ['Shopify'],
    imageUrl: p.images[0]?.src,
  };
}

export function mapShopifyOrdersToSales(
  orders: ShopifyOrder[],
): { date: string; revenue: number }[] {
  const byDay: Record<string, number> = {};
  for (const o of orders) {
    const day = o.created_at.slice(0, 10);
    const amount = Number.parseFloat(o.total_price);
    if (!Number.isFinite(amount)) continue;
    byDay[day] = (byDay[day] ?? 0) + amount;
  }
  return Object.entries(byDay)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/shopify-map.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shopify-map.ts tests/unit/shopify-map.test.ts
git commit -m "feat(shopify): pure mapping helpers for products + orders"
```

---

## Task 3: Parameterized Shopify fetchers

**Files:**
- Modify: `src/lib/shopify.ts` (full rewrite)

- [ ] **Step 1: Rewrite `shopify.ts`**

Replace the entire contents of `src/lib/shopify.ts` with:

```ts
import type { ShopifyProduct, ShopifyOrder } from './shopify-map';

export type { ShopifyProduct, ShopifyOrder };

interface ShopifyCreds {
  domain: string;
  token: string;
}

const API_VERSION = '2024-10';

function authHeaders(token: string): HeadersInit {
  return { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };
}

export async function fetchShopifyProducts(
  { domain, token }: ShopifyCreds,
): Promise<ShopifyProduct[]> {
  const url = `https://${domain}/admin/api/${API_VERSION}/products.json?limit=50`;
  const res = await fetch(url, { headers: authHeaders(token), cache: 'no-store' });
  if (!res.ok) throw new Error(`Shopify products API error: ${res.status}`);
  const data = (await res.json()) as { products: ShopifyProduct[] };
  return data.products;
}

export async function fetchShopifyOrders(
  { domain, token, sinceDays }: ShopifyCreds & { sinceDays: number },
): Promise<ShopifyOrder[]> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const url =
    `https://${domain}/admin/api/${API_VERSION}/orders.json` +
    `?status=any&created_at_min=${encodeURIComponent(since)}&limit=250`;
  const res = await fetch(url, { headers: authHeaders(token), cache: 'no-store' });
  if (!res.ok) throw new Error(`Shopify orders API error: ${res.status}`);
  const data = (await res.json()) as { orders: ShopifyOrder[] };
  return data.orders;
}
```

Note: the old env-based code and the unused `fetchShopifyProduct` are intentionally
removed — `fetchShopifyProduct` had no callers, and credentials now come from the
connected store, not env vars.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/shopify.ts
git commit -m "feat(shopify): parameterized product + order fetchers (per-store creds)"
```

---

## Task 4: `store-connections.ts` server reader

**Files:**
- Create: `src/lib/store-connections.ts`

- [ ] **Step 1: Implement the readers**

Create `src/lib/store-connections.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ShopifyConnection {
  domain: string;
  token: string;
}

export interface StoreConnectionInfo {
  platform: string;
  domain: string;
  storeName: string;
}

// Full Shopify credentials for server-side fetching. Returns null when the
// current user has no Shopify connection.
export async function getShopifyConnection(
  supabase: SupabaseClient,
): Promise<ShopifyConnection | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('store_connections')
    .select('domain, access_token')
    .eq('profile_id', user.id)
    .eq('platform', 'shopify')
    .maybeSingle();
  if (!data) return null;
  return { domain: data.domain, token: data.access_token };
}

// Non-secret connection info (no token) for hydrating client UI.
export async function getStoreConnections(
  supabase: SupabaseClient,
): Promise<StoreConnectionInfo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('store_connections')
    .select('platform, domain, store_name')
    .eq('profile_id', user.id);
  return (data ?? []).map((r) => ({
    platform: r.platform,
    domain: r.domain,
    storeName: r.store_name,
  }));
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/store-connections.ts
git commit -m "feat(connections): server-side readers for store_connections"
```

---

## Task 5: `saveStoreConnection` / `removeStoreConnection` server actions

**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/settings/actions.ts`

- [ ] **Step 1: Append the two actions**

The file currently exports only `setAppMode`. Add these imports and functions.
At the top, the existing imports are:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { AppMode } from '@/lib/app-mode';
```

Add this import line below them:

```ts
import type { MarketplaceId } from '@/lib/connections';
```

Then append to the end of the file:

```ts
function normalizeDomain(raw: string): string {
  return raw.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

export async function saveStoreConnection(
  platform: MarketplaceId,
  conn: { domain: string; token: string; storeName: string },
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  const domain = normalizeDomain(conn.domain);
  if (!domain || !conn.token.trim() || !conn.storeName.trim()) {
    return { error: 'missing_fields' };
  }

  const { error } = await supabase.from('store_connections').upsert(
    {
      profile_id: user.id,
      platform,
      domain,
      access_token: conn.token.trim(),
      store_name: conn.storeName.trim(),
    },
    { onConflict: 'profile_id,platform' },
  );
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function removeStoreConnection(
  platform: MarketplaceId,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  const { error } = await supabase
    .from('store_connections')
    .delete()
    .eq('profile_id', user.id)
    .eq('platform', platform);
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(dashboard)/dashboard/settings/actions.ts"
git commit -m "feat(settings): saveStoreConnection / removeStoreConnection actions"
```

---

## Task 6: `StoreConnectionsProvider` + `useStoreConnections`

**Files:**
- Create: `src/components/StoreConnectionsProvider.tsx`

- [ ] **Step 1: Implement the provider**

Create `src/components/StoreConnectionsProvider.tsx`:

```tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { MarketplaceId } from '@/lib/connections';
import {
  saveStoreConnection,
  removeStoreConnection,
} from '@/app/[locale]/(dashboard)/dashboard/settings/actions';

export interface MarketplaceConn {
  domain: string;
  storeName: string;
}

export type MarketplaceConnMap = Partial<Record<MarketplaceId, MarketplaceConn>>;

type ActionResult = { ok: true } | { error: string };

interface StoreConnectionsValue {
  marketplaces: MarketplaceConnMap;
  hasAnyMarketplace: boolean;
  connect: (
    platform: MarketplaceId,
    conn: { domain: string; storeName: string; token: string },
  ) => Promise<ActionResult>;
  disconnect: (platform: MarketplaceId) => Promise<ActionResult>;
}

const StoreConnectionsContext = createContext<StoreConnectionsValue | null>(null);

export function StoreConnectionsProvider({
  initial,
  children,
}: {
  initial: MarketplaceConnMap;
  children: ReactNode;
}) {
  const [marketplaces, setMarketplaces] = useState<MarketplaceConnMap>(initial);

  const connect = useCallback<StoreConnectionsValue['connect']>(
    async (platform, conn) => {
      const prev = marketplaces;
      // Optimistic: client UI updates immediately; revert if the action fails.
      setMarketplaces((m) => ({
        ...m,
        [platform]: { domain: conn.domain, storeName: conn.storeName },
      }));
      const res = await saveStoreConnection(platform, conn);
      if ('error' in res) setMarketplaces(prev);
      return res;
    },
    [marketplaces],
  );

  const disconnect = useCallback<StoreConnectionsValue['disconnect']>(
    async (platform) => {
      const prev = marketplaces;
      setMarketplaces((m) => {
        const next = { ...m };
        delete next[platform];
        return next;
      });
      const res = await removeStoreConnection(platform);
      if ('error' in res) setMarketplaces(prev);
      return res;
    },
    [marketplaces],
  );

  return (
    <StoreConnectionsContext.Provider
      value={{
        marketplaces,
        hasAnyMarketplace: Object.keys(marketplaces).length > 0,
        connect,
        disconnect,
      }}
    >
      {children}
    </StoreConnectionsContext.Provider>
  );
}

export function useStoreConnections(): StoreConnectionsValue {
  const ctx = useContext(StoreConnectionsContext);
  if (!ctx) {
    throw new Error('useStoreConnections must be used inside <StoreConnectionsProvider>');
  }
  return ctx;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StoreConnectionsProvider.tsx
git commit -m "feat(connections): server-hydrated StoreConnectionsProvider + hook"
```

---

## Task 7: Wire the provider into the dashboard layout

**Files:**
- Modify: `src/app/[locale]/(dashboard)/layout.tsx`

- [ ] **Step 1: Replace the layout file**

Replace the entire contents of `src/app/[locale]/(dashboard)/layout.tsx` with:

```tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';
import { AppModeProvider } from '@/components/AppModeProvider';
import {
  StoreConnectionsProvider,
  type MarketplaceConnMap,
} from '@/components/StoreConnectionsProvider';
import { getAppMode } from '@/lib/app-mode';
import { getStoreConnections } from '@/lib/store-connections';
import type { MarketplaceId } from '@/lib/connections';

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

  const [profileResult, mode, storeConns] = await Promise.all([
    supabase
      .from('profiles')
      .select('business_name, preferred_language')
      .eq('id', user.id)
      .single(),
    getAppMode(supabase),
    getStoreConnections(supabase),
  ]);

  const marketplaces: MarketplaceConnMap = {};
  for (const c of storeConns) {
    marketplaces[c.platform as MarketplaceId] = {
      domain: c.domain,
      storeName: c.storeName,
    };
  }

  return (
    <AppModeProvider initialMode={mode}>
      <StoreConnectionsProvider initial={marketplaces}>
        <DashboardShell
          locale={locale}
          businessName={profileResult.data?.business_name ?? 'KOBİ Sahibi'}
        >
          {children}
        </DashboardShell>
      </StoreConnectionsProvider>
    </AppModeProvider>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(dashboard)/layout.tsx"
git commit -m "feat(dashboard): hydrate StoreConnectionsProvider from store_connections"
```

---

## Task 8: `SettingsClient` — use `useStoreConnections` for marketplaces

**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/settings/SettingsClient.tsx`

- [ ] **Step 1: Update imports**

Find this import:

```tsx
import { useConnections } from '@/lib/connections';
```

Replace it with:

```tsx
import { useConnections } from '@/lib/connections';
import { useStoreConnections } from '@/components/StoreConnectionsProvider';
```

- [ ] **Step 2: Swap the marketplace hook + connect/disconnect handlers**

Find this block (the hooks and the `connect` / `disconnect` handlers):

```tsx
  const { mode, setMode } = useAppMode();
  // One localStorage-backed hook for every connection consumer — the
  // marketplace cards, the mode toggle's gate, and the dashboard page
  // gates all read the same state, so connecting a store reflects
  // everywhere immediately (the hook broadcasts a change event that
  // a private SettingsClient copy never did).
  const {
    marketplaces,
    setMarketplaces,
    hasAnyMarketplace,
    socials,
    setSocials,
  } = useConnections();
  const [openSocialForm, setOpenSocialForm] = useState<SocialId | null>(null);
  const [modePending, startModeTransition] = useTransition();

  const connect = (id: MarketplaceDef['id'], data: Connection) => {
    setMarketplaces({ ...marketplaces, [id]: data });
    setOpenForm(null);
    notifications.show({
      color: 'green',
      title: isTr ? 'Bağlandı' : 'Connected',
      message: `${MARKETPLACES.find(m => m.id === id)?.name} → ${data.storeName}`,
      autoClose: 3500,
    });
  };

  const disconnect = (id: MarketplaceDef['id']) => {
    const next = { ...marketplaces };
    delete next[id];
    setMarketplaces(next);
    notifications.show({
      color: 'gray',
      message: isTr ? 'Bağlantı kaldırıldı' : 'Disconnected',
      autoClose: 2500,
    });
  };
```

Replace it with:

```tsx
  const { mode, setMode } = useAppMode();
  // Marketplace connections are DB-backed (store_connections) via the
  // server-hydrated provider; socials still use the localStorage hook.
  const {
    marketplaces,
    hasAnyMarketplace,
    connect: connectStore,
    disconnect: disconnectStore,
  } = useStoreConnections();
  const { socials, setSocials } = useConnections();
  const [openSocialForm, setOpenSocialForm] = useState<SocialId | null>(null);
  const [modePending, startModeTransition] = useTransition();

  const connect = async (id: MarketplaceDef['id'], data: Connection) => {
    const res = await connectStore(id, {
      domain: data.url,
      storeName: data.storeName,
      token: data.key,
    });
    if ('error' in res) {
      notifications.show({
        color: 'red',
        message: isTr ? 'Bağlanamadı — tekrar dene' : 'Connection failed — try again',
      });
      return;
    }
    setOpenForm(null);
    notifications.show({
      color: 'green',
      title: isTr ? 'Bağlandı' : 'Connected',
      message: `${MARKETPLACES.find(m => m.id === id)?.name} → ${data.storeName}`,
      autoClose: 3500,
    });
  };

  const disconnect = async (id: MarketplaceDef['id']) => {
    const res = await disconnectStore(id);
    if ('error' in res) {
      notifications.show({
        color: 'red',
        message: isTr ? 'Kaldırılamadı' : 'Disconnect failed',
      });
      return;
    }
    notifications.show({
      color: 'gray',
      message: isTr ? 'Bağlantı kaldırıldı' : 'Disconnected',
      autoClose: 2500,
    });
  };
```

- [ ] **Step 3: Update the marketplace card's "Open Store" link**

The card reads `const conn = marketplaces[m.id];`. `conn` is now a
`{ domain, storeName }` object. Find the "Open Store" link:

```tsx
                      <a
                        href={conn.url.startsWith('http') ? conn.url : `https://${conn.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary btn-small"
                      >
```

Replace it with:

```tsx
                      <a
                        href={`https://${conn.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary btn-small"
                      >
```

- [ ] **Step 4: Update the marketplace card's URL meta row**

Find this block inside the marketplace card:

```tsx
                  <div>
                    <span className="marketplace-meta-label">URL</span>
                    <span className="marketplace-meta-value" title={conn.url}>{conn.url}</span>
                  </div>
```

Replace it with:

```tsx
                  <div>
                    <span className="marketplace-meta-label">URL</span>
                    <span className="marketplace-meta-value" title={conn.domain}>{conn.domain}</span>
                  </div>
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (The `Connection` interface and `ConnectForm` are unchanged —
`ConnectForm` still collects `storeName` / `url` / `key`; `connect` maps `url`→`domain`
and `key`→`token`.)

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(dashboard)/dashboard/settings/SettingsClient.tsx"
git commit -m "feat(settings): marketplace cards use DB-backed StoreConnectionsProvider"
```

---

## Task 9: `RealModeGate` — use `useStoreConnections`

**Files:**
- Modify: `src/components/RealModeGate.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire contents of `src/components/RealModeGate.tsx` with:

```tsx
'use client';

import { type ReactNode } from 'react';
import { useAppMode } from './AppModeProvider';
import { useStoreConnections } from './StoreConnectionsProvider';
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
  const { hasAnyMarketplace } = useStoreConnections();
  if (mode === 'real' && !hasAnyMarketplace) {
    return <ConnectionRequired feature={feature} platforms={platforms} />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RealModeGate.tsx
git commit -m "feat(ui): RealModeGate reads DB-backed connection state"
```

---

## Task 10: `SourceErrorBanner` component

**Files:**
- Create: `src/components/SourceErrorBanner.tsx`

- [ ] **Step 1: Implement the banner**

Create `src/components/SourceErrorBanner.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { IconAlertTriangle, IconX } from '@tabler/icons-react';

// Shown when a real-mode page failed to reach Shopify and fell back to
// seeded data — so the seeded data is never mistaken for live data.
export function SourceErrorBanner({ locale }: { locale: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const isTr = locale === 'tr';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 12,
        background: 'color-mix(in srgb, var(--c-amber) 12%, transparent)',
        border: '1px solid color-mix(in srgb, var(--c-amber) 35%, var(--border))',
        color: 'var(--fg)',
        fontSize: 13.5,
      }}
    >
      <IconAlertTriangle
        size={16}
        stroke={2}
        style={{ color: 'var(--c-amber)', flexShrink: 0 }}
      />
      <span style={{ flex: 1 }}>
        {isTr
          ? "Shopify'a ulaşılamadı — bağlantını kontrol et. Şimdilik örnek veri gösteriliyor."
          : 'Could not reach Shopify — check your connection. Showing seeded data for now.'}
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={isTr ? 'Kapat' : 'Dismiss'}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--fg-mute)',
          cursor: 'pointer',
          display: 'inline-flex',
        }}
      >
        <IconX size={15} stroke={2.2} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SourceErrorBanner.tsx
git commit -m "feat(ui): SourceErrorBanner for Shopify fetch fallback"
```

---

## Task 11: Products page — real-mode wiring

**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/products/page.tsx`

- [ ] **Step 1: Replace the page file**

Replace the entire contents of `src/app/[locale]/(dashboard)/dashboard/products/page.tsx` with:

```tsx
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/ProductCard';
import { Title, Stack, SimpleGrid } from '@mantine/core';
import { RealModeGate } from '@/components/RealModeGate';
import { SourceErrorBanner } from '@/components/SourceErrorBanner';
import { getAppMode } from '@/lib/app-mode';
import { getShopifyConnection } from '@/lib/store-connections';
import { fetchShopifyProducts } from '@/lib/shopify';
import { mapShopifyProduct, type MappedProduct } from '@/lib/shopify-map';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const mode = await getAppMode(supabase);

  let items: MappedProduct[] = [];
  let sourceError = false;

  const shopify = mode === 'real' ? await getShopifyConnection(supabase) : null;
  if (shopify) {
    try {
      const products = await fetchShopifyProducts(shopify);
      items = products.map(mapShopifyProduct);
    } catch {
      sourceError = true;
    }
  }

  // Seeded fallback: mock mode, no connection, or a failed Shopify fetch.
  if (!shopify || sourceError) {
    const { data } = await supabase
      .from('products')
      .select('id, name, current_price, category, channels, images');
    items = (data ?? []).map((p) => ({
      name: p.name,
      price: p.current_price,
      category: p.category,
      channels: (p.channels as string[]) ?? [],
      imageUrl: (p.images as string[])?.[0],
    }));
  }

  return (
    <RealModeGate
      feature={locale === 'tr' ? 'Ürünler' : 'Products'}
      platforms={['Shopify', 'Trendyol']}
    >
      <Stack gap="lg">
        <Title order={1}>Ürünler</Title>
        {sourceError && <SourceErrorBanner locale={locale} />}
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
          {items.map((p, i) => (
            <ProductCard
              key={i}
              name={p.name}
              price={p.price}
              category={p.category}
              channels={p.channels}
              imageUrl={p.imageUrl}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </RealModeGate>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(dashboard)/dashboard/products/page.tsx"
git commit -m "feat(products): live Shopify products in real mode"
```

---

## Task 12: Cashflow — inject Shopify orders as the sales history

**Files:**
- Modify: `src/agents/tools/cashflow-compute.ts`
- Modify: `src/app/[locale]/(dashboard)/dashboard/cashflow/page.tsx`

- [ ] **Step 1: Make `computeCashFlowBase` accept an optional `salesHistory`**

In `src/agents/tools/cashflow-compute.ts`, find the function signature and the
first part of the body:

```ts
export async function computeCashFlowBase(
  { scenario, days }: { scenario: Scenario; days: number },
): Promise<CashFlowBase> {
  const sales = await fetchSalesHistory(days);
  const expenses = await fetchPendingExpenses(days);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let currentBalance = 0;
  if (user) {
    const { data: salesAll } = await supabase
      .from('sales').select('total_revenue').eq('profile_id', user.id);
    currentBalance = (salesAll ?? []).reduce((s: number, r: { total_revenue: number }) => s + r.total_revenue, 0)
      - expenses.reduce((s, e) => s + e.amount, 0) * 0.3;
  }
```

Replace that with:

```ts
export async function computeCashFlowBase(
  {
    scenario,
    days,
    salesHistory,
  }: {
    scenario: Scenario;
    days: number;
    salesHistory?: { date: string; revenue: number }[];
  },
): Promise<CashFlowBase> {
  // Real mode injects Shopify-derived sales history; otherwise read Supabase.
  const sales = salesHistory ?? (await fetchSalesHistory(days));
  const expenses = await fetchPendingExpenses(days);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

  let currentBalance = 0;
  if (salesHistory) {
    currentBalance =
      salesHistory.reduce((s, r) => s + r.revenue, 0) - expenseTotal * 0.3;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: salesAll } = await supabase
        .from('sales').select('total_revenue').eq('profile_id', user.id);
      currentBalance =
        (salesAll ?? []).reduce(
          (s: number, r: { total_revenue: number }) => s + r.total_revenue,
          0,
        ) - expenseTotal * 0.3;
    }
  }
```

The rest of the function (the `dailyAvgRevenue` / `projection` / `riskScore`
logic and the `return`) is unchanged.

- [ ] **Step 2: Replace the cashflow page**

Replace the entire contents of `src/app/[locale]/(dashboard)/dashboard/cashflow/page.tsx` with:

```tsx
import { Stack } from '@mantine/core';
import { computeCashFlowBase } from '@/agents/tools/cashflow-compute';
import { CashFlowClient } from './CashFlowClient';
import type { CashFlowForecast } from '@/agents/schemas';
import { RealModeGate } from '@/components/RealModeGate';
import { SourceErrorBanner } from '@/components/SourceErrorBanner';
import { createClient } from '@/lib/supabase/server';
import { getAppMode } from '@/lib/app-mode';
import { getShopifyConnection } from '@/lib/store-connections';
import { fetchShopifyOrders } from '@/lib/shopify';
import { mapShopifyOrdersToSales } from '@/lib/shopify-map';

export const dynamic = 'force-dynamic';

export default async function CashFlowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const mode = await getAppMode(supabase);

  let salesHistory: { date: string; revenue: number }[] | undefined;
  let sourceError = false;

  const shopify = mode === 'real' ? await getShopifyConnection(supabase) : null;
  if (shopify) {
    try {
      const orders = await fetchShopifyOrders({ ...shopify, sinceDays: 90 });
      salesHistory = mapShopifyOrdersToSales(orders);
    } catch {
      sourceError = true;
    }
  }

  // Fast SSR: deterministic projection only (no LLM). When salesHistory is
  // undefined (mock mode / no connection / failed fetch) computeCashFlowBase
  // falls back to seeded Supabase sales.
  const base = await computeCashFlowBase({ scenario: 'current', days: 90, salesHistory });
  const initial: CashFlowForecast = {
    scenario: base.scenario,
    days: base.days,
    projection: base.projection,
    riskScore: base.riskScore,
    commentary: '',
  };

  return (
    <RealModeGate
      feature={locale === 'tr' ? 'Nakit Akışı' : 'Cash Flow'}
      platforms={['Shopify']}
    >
      <Stack gap="md">
        {sourceError && <SourceErrorBanner locale={locale} />}
        <CashFlowClient initial={initial} locale={locale} />
      </Stack>
    </RealModeGate>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/agents/tools/cashflow-compute.ts "src/app/[locale]/(dashboard)/dashboard/cashflow/page.tsx"
git commit -m "feat(cashflow): project from live Shopify orders in real mode"
```

---

## Task 13: Today page — real-mode order count

**Files:**
- Modify: `src/app/[locale]/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Replace the page file**

Replace the entire contents of `src/app/[locale]/(dashboard)/dashboard/page.tsx` with:

```tsx
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@/lib/supabase/server';
import { getAppMode } from '@/lib/app-mode';
import { getShopifyConnection } from '@/lib/store-connections';
import { fetchShopifyOrders } from '@/lib/shopify';
import { SourceErrorBanner } from '@/components/SourceErrorBanner';
import { DashboardCard } from '@/components/DashboardCard';
import { BriefCard } from '@/components/BriefCard';
import { Title, SimpleGrid, Stack, Badge } from '@mantine/core';
import type { BriefItem } from '@/agents/schemas';

async function loadEvalsScore(): Promise<{
  overallAvg: number;
  totalCases: number;
  passRate: number;
} | null> {
  try {
    const file = await fs.readFile(
      path.join(process.cwd(), 'tests/evals/results.json'),
      'utf-8',
    );
    const data = JSON.parse(file);
    return data.summary ?? null;
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const mode = await getAppMode(supabase);
  const sinceYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Today's order count: live Shopify in real mode, seeded `sales` otherwise.
  let orderCount = 0;
  let sourceError = false;
  const shopify = mode === 'real' ? await getShopifyConnection(supabase) : null;
  if (shopify) {
    try {
      const orders = await fetchShopifyOrders({ ...shopify, sinceDays: 1 });
      orderCount = orders.length;
    } catch {
      sourceError = true;
    }
  }
  if (!shopify || sourceError) {
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .gte('occurred_at', sinceYesterday);
    orderCount = count ?? 0;
  }

  const [evalsScore, { count: reviewCount }, { count: negReviewCount }] =
    await Promise.all([
      loadEvalsScore(),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .lte('rating', 3),
    ]);

  // Brief is derived from current data state (fast, no Gemini call).
  // For real agentic interaction, user goes to /chat where Captain runs live.
  const brief: BriefItem[] = locale === 'tr'
    ? [
        { status: 'warn', text: `${negReviewCount ?? 0} yorum negatif eğilimde — yanıt taslakları için Kaptan ile konuş` },
        { status: 'info', text: 'Rakipler son 7 günde ortalama %12 fiyat artırdı — Fiyat ajanı analizi hazır' },
        { status: 'ok', text: '3 ürünün SEO başlığı zayıf görünüyor — SEO ajanı taslak hazırladı' },
        { status: 'ok', text: 'Bu ay nakit pozisyon güvenli görünüyor' },
      ]
    : [
        { status: 'warn', text: `${negReviewCount ?? 0} reviews trending negative — talk to Captain for reply drafts` },
        { status: 'info', text: 'Competitors raised prices ~12% in last 7 days — Pricing agent analysis ready' },
        { status: 'ok', text: '3 products have weak SEO titles — SEO agent has drafts ready' },
        { status: 'ok', text: 'Cash position looks safe this month' },
      ];

  return (
    <Stack gap="lg">
      <Title order={1}>{locale === 'tr' ? 'Günaydın' : 'Good morning'}</Title>

      {sourceError && <SourceErrorBanner locale={locale} />}

      <BriefCard locale={locale} items={brief} />

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }}>
        <DashboardCard label={locale === 'tr' ? 'Bugün Sipariş' : "Today's Orders"} value={orderCount} />
        <DashboardCard label={locale === 'tr' ? 'Bekleyen Yorum' : 'Pending Reviews'} value={reviewCount ?? 0} />
        <DashboardCard label={locale === 'tr' ? 'Açık Aksiyon' : 'Open Actions'} value={brief.filter(b => b.status !== 'ok').length} />
        <DashboardCard
          label={locale === 'tr' ? 'Nakit Pozisyon' : 'Cash Position'}
          value={<Badge color="teal" variant="light" size="lg">{locale === 'tr' ? 'Güvenli' : 'Safe'}</Badge>}
        />
        {evalsScore && (
          <DashboardCard
            label={locale === 'tr' ? 'Ajan Doğruluk' : 'Agent Accuracy'}
            value={`${(evalsScore.overallAvg * 100).toFixed(0)}%`}
            hint={`${evalsScore.totalCases} ${locale === 'tr' ? 'senaryo' : 'scenarios'}`}
          />
        )}
      </SimpleGrid>
    </Stack>
  );
}
```

Note: only the "Today's Orders" card becomes live. The "Cash Position" card stays
a static badge in both modes — it was never computed from data; real cash
analysis lives on the Finans page.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(dashboard)/dashboard/page.tsx"
git commit -m "feat(today): live Shopify order count in real mode"
```

---

## Task 14: Full verification sweep

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Run all unit tests**

Run: `npx vitest run`
Expected: all pre-existing tests pass + the new `shopify-map.test.ts` (4 tests).

- [ ] **Step 3: Run the E2E suite**

Run: `npx playwright test`
Expected: the 8 pre-existing tests still pass. The connection now persists to the
DB; `auth`, `chat`, `chat-history`, `i18n`, `cashflow`, `landing-to-signup` are
unaffected because they run in mock mode (default `app_mode`).

- [ ] **Step 4: Manual smoke checklist**

Run `npm run dev` and verify, signed in as the demo user:

1. **Mock mode (default):** Products, Cashflow, Today show seeded data. No banner.
2. Settings → connect Shopify with a real domain + a token that has
   `read_products` and `read_orders` scopes. The card shows "Bağlı".
3. Reload Settings — the connection persists (it is now in `store_connections`,
   not just localStorage).
4. Toggle to **Real mode** — succeeds (a store is connected).
5. **Ürünler** shows the Shopify store's real products.
6. **Finans** projection reflects the Shopify store's orders.
7. **Bugün** "Bugün Sipariş" reflects the Shopify store's last-24h order count.
8. **Sosyal** product picker lists the real Shopify products.
9. Disconnect Shopify in Settings, stay in Real mode → Products/Cashflow show the
   `ConnectionRequired` gate.
10. Reconnect with a deliberately bad token → real-mode pages show the seeded data
    **and** the amber `SourceErrorBanner`.

- [ ] **Step 5: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: cleanup after real Shopify data verification"
```

---

## Acceptance Criteria

- In Real mode with a valid Shopify connection, Products / Cashflow / Today / Social
  show live Shopify data.
- In Mock mode, every page shows seeded data exactly as before.
- A failed Shopify fetch falls back to seeded data and shows the `SourceErrorBanner`.
- Marketplace connections persist across reloads (DB-backed).
- Reviews and Trace are unchanged.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| The connected token lacks `read_products` / `read_orders` scope | The fetch throws → caught → seeded fallback + `SourceErrorBanner`. The user must grant scopes on the Shopify app. |
| Shopify store has >250 products/orders | Out of scope for the hackathon demo — the fetchers cap at `limit=50` (products) / `limit=250` (orders), no pagination. Note in the PR if it matters. |
| Migration not applied to the hosted DB | Task 1 Step 2 verifies with a REST probe before proceeding. |
| Importing the server action from a route-group path (`(dashboard)`) | Valid — `(dashboard)` and `[locale]` are ordinary folders; the `@/` alias resolves them. |
