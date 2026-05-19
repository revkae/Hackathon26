# Real Shopify Data Integration — Design

**Date:** 2026-05-19
**Status:** Approved (design)

## Goal

In **Real (Gerçek) mode**, the Products, Cashflow, and Today pages show live data
from the user's connected Shopify store instead of seeded Supabase data. Mock
(Demo) mode is unchanged.

## Background — the problem

Today the `app_mode` flag (`mock` / `real`) only drives `RealModeGate`: in real
mode with no connected marketplace it shows a "connect a store" gate. It **never
changes the data source** — every dashboard page reads seeded Supabase data in
both modes. `src/lib/shopify.ts` has a `fetchShopifyProducts()` function, but
nothing imports it, and it reads a stale env token that returns HTTP 403
(`read_products` scope not approved).

The user connects a Shopify store through the Settings form, which stores the
credentials in browser `localStorage`. The dashboard pages are **server
components** that render on the server and cannot read `localStorage`. So the
token must be persisted somewhere the server can read it.

## Scope

**In scope — live Shopify data in real mode:**
- **Ürünler** (Products) — product grid from Shopify Products API.
- **Finans** (Cashflow) — projection input derived from Shopify Orders API.
- **Bugün** (Today) — order count and cash position derived from Shopify Orders.
- **Sosyal** (Social) — follows Products automatically (its product picker reads
  the Products data; no separate work).

**Out of scope / unchanged:**
- **Yorumlar** (Reviews) — stays on seeded data in both modes. Shopify has no
  product-reviews API; product reviews exist only via third-party apps.
- **Trace** — unchanged. It shows the AI agents' execution log, not store data,
  and is already real whenever the Captain runs.
- **Social connections** — stay in `localStorage`; no real-data need yet.
- **Trendyol / Hepsiburada / Etsy** — still connectable and still gate pages via
  `RealModeGate`, but do not fetch live data. Only Shopify fetches live data.
- **Token encryption** — out of scope. `access_token` is a plaintext column,
  protected by RLS. Production would move this to Supabase Vault.

## Architecture

### 1. Data model — `store_connections` table

```sql
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
-- policies: select / insert / update / delete where profile_id = auth.uid()
```

One row per connected marketplace. The migration must be applied manually to the
hosted Supabase project (the project has no linked CLI / access token — see the
`project-supabase-migrations-manual` note).

### 2. Connection state — moved server-side

Marketplace connections move from `localStorage` to `store_connections`:

- **Server actions** in `settings/actions.ts`:
  - `saveStoreConnection(platform, { domain, token, storeName })` — upsert.
  - `removeStoreConnection(platform)` — delete.
- The dashboard layout (`(dashboard)/layout.tsx`, already a server component)
  reads the user's `store_connections` rows alongside the profile and `app_mode`,
  and passes them into a new `StoreConnectionsProvider`.
- A new `useStoreConnections()` hook reads that provider and exposes
  `marketplaces`, `hasAnyMarketplace`, and `connect` / `disconnect` actions that
  call the server actions and optimistically update context.
- `SettingsClient` (marketplace cards) and `RealModeGate` switch from
  `useConnections` to `useStoreConnections` for marketplaces.
- **Social** connections keep using the existing `localStorage`-backed
  `useConnections` hook (socials half only).

Result: the server (data pages) and the client (Settings cards, `RealModeGate`)
read the same connection state — one source of truth.

### 3. Shopify data layer (`src/lib/shopify.ts`)

- `fetchShopifyProducts({ domain, token })` — parameterized; takes the connected
  store's credentials instead of reading env vars.
- `fetchShopifyOrders({ domain, token })` — new; fetches recent orders for the
  Cashflow and Today pages.
- Pure mapping helpers (unit-testable, no I/O):
  - `mapShopifyProduct` — Shopify product → `{ name, price, category, channels, imageUrl }`
    (the shape `ProductCard` consumes).
  - `mapShopifyOrdersToSales` — Shopify orders → the daily sales-history shape
    `cashflow-compute` / the Today page already expect.
- All fetches run server-side with `cache: 'no-store'`.

### 4. Page wiring

Each server component reads `app_mode` and the user's Shopify connection
(`store_connections` where `platform = 'shopify'`). When **real mode AND a
Shopify connection exists**, it fetches from Shopify and maps the result;
otherwise it uses seeded Supabase data exactly as today.

- **Ürünler** — product grid from mapped Shopify products.
- **Finans** — `computeCashFlowBase` receives Shopify-derived sales history as
  its input. The forecast math (`movingAverage`, `projectCashFlow`) is
  **unchanged** — only the sales-history input swaps. **Expenses stay seeded**
  (Shopify has no expense concept).
- **Bugün** — "Today's Orders" count and the cash-position indicator derive from
  Shopify orders. The pending-review count stays seeded.
- **Sosyal** — no code change; its product picker reads the Products data, which
  is now live in real mode.

### 5. Data flow (real mode, Products page)

```
Browser (Settings form) --connect--> saveStoreConnection (server action)
                                          |
                                          v
                                  store_connections (DB)
                                          |
   (dashboard)/layout.tsx (server) <-------+
        |  passes connections into StoreConnectionsProvider
        v
   products/page.tsx (server)
        |  mode === 'real' && shopify connection?
        |---- yes --> fetchShopifyProducts({domain,token}) --> mapShopifyProduct --> grid
        |---- no  --> supabase.from('products')                                  --> grid
```

## Error handling

If a Shopify call fails — bad token, missing `read_products` / `read_orders`
scope (403), or a network error — the page:

1. Falls back to seeded Supabase data so it still renders, and
2. Renders a dismissible banner: *"Shopify'a ulaşılamadı — bağlantını kontrol et"*
   (EN: *"Couldn't reach Shopify — check your connection"*).

Silent fallback to mock data without a banner is explicitly avoided — it is the
exact confusion that triggered this work.

## Testing

- **Unit tests** for the pure mapping helpers (`mapShopifyProduct`,
  `mapShopifyOrdersToSales`) — fixture Shopify payload → expected app shape.
- **Manual smoke**: connect a Shopify store in Settings → switch to real mode →
  Products shows live Shopify products; Cashflow/Today reflect Shopify orders;
  force an error (revoke scope) → fallback + banner.

## Prerequisites (user-side)

- The migration SQL for `store_connections` must be applied to the hosted
  Supabase project manually.
- The Shopify token connected through the Settings form must have the
  **`read_products`** and **`read_orders`** scopes granted, or the live pages
  hit a 403 and show the error banner.
