# KOBİ Kaptanı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Multi-agent (5 specialist + 1 orchestrator) e-ticaret/finans asistanı Web uygulamasını 5 günde hackathona hazır şekilde implement et.

**Architecture:** Hibrit C — Orchestrator (Kaptan) + uzman ajanlar arası peer-to-peer tool çağrıları. Next.js 15 (App Router) + Server Actions + Genkit (Gemini) + Supabase (Auth + Postgres) + Resend + Shopify dev store + mock pazaryerleri.

**Tech Stack:** Next.js 15, TypeScript, Tailwind v4, shadcn/ui, next-intl, Vercel AI SDK (UI), Genkit + @genkit-ai/googleai, Zod, Supabase + @supabase/ssr, Resend + React Email, Recharts, Vitest, Playwright, Genkit Evals, Vercel.

**Reference Spec:** `docs/superpowers/specs/2026-05-14-kobi-kaptani-design.md`

---

## File Structure (Final Tree)

```
Hackathon26/
├── supabase/
│   ├── migrations/
│   │   ├── 20260514000001_initial_schema.sql
│   │   └── 20260514000002_rls_policies.sql
│   └── seed.sql
├── data/                        # Mock pazaryeri JSON
│   ├── trendyol-competitors.json
│   ├── hepsiburada-prices.json
│   └── n11-listings.json
├── emails/                      # React Email şablonları
│   ├── verify-email.tsx
│   └── welcome.tsx
├── scripts/
│   ├── seed-db.ts
│   └── run-evals.ts
├── src/
│   ├── middleware.ts            # Auth gate + i18n routing
│   ├── i18n.ts                  # next-intl config
│   ├── messages/
│   │   ├── tr.json
│   │   └── en.json
│   ├── lib/
│   │   ├── env.ts               # Tipli env vars
│   │   ├── utils.ts             # cn (clsx)
│   │   ├── supabase/
│   │   │   ├── server.ts
│   │   │   ├── client.ts
│   │   │   └── middleware.ts
│   │   ├── resend.ts
│   │   └── shopify.ts
│   ├── agents/
│   │   ├── genkit.ts            # Genkit init
│   │   ├── schemas.ts           # Shared Zod schemas
│   │   ├── captain.ts
│   │   ├── seo.ts
│   │   ├── marketing.ts
│   │   ├── pricing.ts
│   │   ├── reviews.ts           # Faz 2
│   │   ├── cashflow.ts          # Faz 3
│   │   └── tools/
│   │       ├── shopify-tools.ts
│   │       ├── marketplace-tools.ts
│   │       ├── review-tools.ts
│   │       └── forecast.ts
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # / → dashboard redirect
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── signup/page.tsx
│   │   │   │   └── verify/page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx     # Bugün
│   │   │       ├── chat/page.tsx
│   │   │       ├── trace/page.tsx
│   │   │       ├── products/page.tsx
│   │   │       ├── reviews/page.tsx
│   │   │       └── cashflow/page.tsx
│   │   └── api/
│   │       ├── agent/route.ts   # Streaming endpoint
│   │       └── auth/callback/route.ts
│   └── components/
│       ├── ui/                  # shadcn
│       ├── Sidebar.tsx
│       ├── Topbar.tsx
│       ├── DashboardCard.tsx
│       ├── BriefCard.tsx
│       ├── ChatPanel.tsx
│       ├── AgentChip.tsx
│       ├── AgentTimeline.tsx
│       ├── CashFlowChart.tsx
│       ├── ProductCard.tsx
│       ├── ReviewItem.tsx
│       └── LanguageToggle.tsx
├── tests/
│   ├── unit/
│   │   ├── forecast.test.ts
│   │   ├── schemas.test.ts
│   │   └── mock-adapters.test.ts
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── chat.spec.ts
│   │   ├── cashflow.spec.ts
│   │   └── i18n.spec.ts
│   └── evals/
│       ├── seo-eval.json
│       ├── marketing-eval.json
│       ├── pricing-eval.json
│       ├── reviews-eval.json
│       └── cashflow-eval.json
├── playwright.config.ts
├── vitest.config.ts
├── next.config.ts
├── tailwind.config.ts
├── components.json              # shadcn config
├── package.json
├── tsconfig.json
└── .env.local
```

---

## Phase Index

- **Faz 0** — Setup & Foundation (Day 1 sabah) — Tasks 1-12
- **Faz 1** — Auth + Dashboard + İlk 3 Ajan (Day 1 öğleden sonra + Day 2) — Tasks 13-30
- **Faz 2** — Yorum Ajanı + Deploy + E2E (Day 3) — Tasks 31-42
- **Faz 3** — Nakit Akışı + Trace UI + i18n Polish (Day 4) — Tasks 43-54
- **Faz 4** — Evals + Cila + Sunum (Day 5) — Tasks 55-65

---

> **Note on TDD:** Strict TDD uygulanır: Zod schemas, forecast utility, mock adapters (saf logic). Implementation-first: ajan prompts, UI components, integration (test-after with manual demo + Vitest where high-value). Evals = post-hoc benchmark.

---

# Faz 0 — Setup & Foundation (Day 1 Sabah, ~4 saat)

## Task 1: Initialize Next.js Project Dependencies

**Files:**
- Modify: `package.json`
- Create: `.env.local`

- [ ] **Step 1: Install core Next.js + React deps**

```bash
npm install next@15 react@latest react-dom@latest
npm install -D @types/node @types/react @types/react-dom
```

- [ ] **Step 2: Install Tailwind v4**

```bash
npm install -D tailwindcss@next @tailwindcss/postcss postcss
```

- [ ] **Step 3: Install i18n + UI deps**

```bash
npm install next-intl zod clsx tailwind-merge
npm install class-variance-authority lucide-react
```

- [ ] **Step 4: Install Supabase + auth**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 5: Install Genkit + Gemini**

```bash
npm install genkit @genkit-ai/googleai @genkit-ai/next
npm install -D genkit-cli
```

- [ ] **Step 6: Install Resend + React Email**

```bash
npm install resend react-email @react-email/components
```

- [ ] **Step 7: Install Vercel AI SDK (UI)**

```bash
npm install ai @ai-sdk/react
```

- [ ] **Step 8: Install Recharts**

```bash
npm install recharts
```

- [ ] **Step 9: Install dev tooling**

```bash
npm install -D vitest @vitest/ui @playwright/test
```

- [ ] **Step 10: Add scripts to package.json**

Modify `package.json` `scripts` section:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "genkit:dev": "genkit start -- npx tsx src/agents/genkit.ts",
    "evals": "tsx scripts/run-evals.ts",
    "seed": "tsx scripts/seed-db.ts"
  }
}
```

- [ ] **Step 11: Create empty `.env.local`**

```bash
# (PowerShell)
New-Item -ItemType File .env.local -Force
```

Add placeholder content:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@yourdomain.com

# Gemini
GEMINI_API_KEY=

# Shopify
SHOPIFY_STORE_DOMAIN=
SHOPIFY_ADMIN_ACCESS_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json .env.local
git commit -m "chore: project dependencies"
```

---

## Task 2: Configure TypeScript + Next.js

**Files:**
- Modify: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts` (auto-generated by Next.js)

- [ ] **Step 1: Update `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Create `next.config.ts`**

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // Genkit needs Node.js runtime, not Edge
  serverExternalPackages: ['@genkit-ai/googleai', 'genkit'],
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 3: Verify build works (no server yet)**

```bash
npx tsc --noEmit
```

Expected: No errors (project compiles).

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json next.config.ts
git commit -m "chore: typescript and next.js config"
```

---

## Task 3: Configure Tailwind v4 + PostCSS

**Files:**
- Create: `postcss.config.mjs`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create `postcss.config.mjs`**

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

- [ ] **Step 2: Create `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-emerald-accent: #10b981;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

@layer base {
  :root {
    --background: oklch(0.99 0 0);
    --foreground: oklch(0.15 0 0);
    --card: oklch(0.99 0 0);
    --card-foreground: oklch(0.15 0 0);
    --primary: oklch(0.55 0.18 155);
    --primary-foreground: oklch(0.99 0 0);
    --muted: oklch(0.96 0 0);
    --muted-foreground: oklch(0.5 0 0);
    --border: oklch(0.9 0 0);
    --radius: 0.5rem;
  }
  .dark {
    --background: oklch(0.13 0 0);
    --foreground: oklch(0.96 0 0);
    --card: oklch(0.17 0 0);
    --card-foreground: oklch(0.96 0 0);
    --primary: oklch(0.65 0.18 155);
    --primary-foreground: oklch(0.13 0 0);
    --muted: oklch(0.21 0 0);
    --muted-foreground: oklch(0.7 0 0);
    --border: oklch(0.25 0 0);
  }
  body {
    background: var(--background);
    color: var(--foreground);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add postcss.config.mjs src/app/globals.css
git commit -m "chore: tailwind v4 setup"
```

---

## Task 4: Initialize shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create `src/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3: Add base shadcn components**

```bash
npx shadcn@latest add button card input label dialog dropdown-menu badge tabs scroll-area sonner sheet skeleton chart
```

- [ ] **Step 4: Verify components were created**

```bash
ls src/components/ui
```

Expected output includes: `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `badge.tsx`, `tabs.tsx`, `scroll-area.tsx`, `sonner.tsx`, `sheet.tsx`, `skeleton.tsx`, `chart.tsx`

- [ ] **Step 5: Commit**

```bash
git add components.json src/lib/utils.ts src/components/ui/
git commit -m "chore: shadcn/ui base components"
```

---

## Task 5: Setup Supabase Project (External)

**External steps (no code yet):**

- [ ] **Step 1: Create Supabase project**

1. Go to https://supabase.com → sign in
2. New project → name: `kobi-kaptani-hackathon`
3. Region: `eu-central-1` (Frankfurt — Türkiye'ye yakın)
4. Strong db password — save in password manager
5. Wait ~2 minutes for provisioning

- [ ] **Step 2: Copy keys to `.env.local`**

From Supabase dashboard → Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (server-only)

- [ ] **Step 3: Disable email confirmation requirement for hackathon dev**

Supabase dashboard → Authentication → Providers → Email:
- Enable Email provider: ON
- Confirm email: OFF (for faster dev iteration)
- (Will re-enable in production with Resend SMTP — Task 9)

- [ ] **Step 4: Test connection**

```bash
curl "$env:NEXT_PUBLIC_SUPABASE_URL/rest/v1/" -H "apikey: $env:NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Expected: JSON response with `swagger` or similar.

---

## Task 6: Create Database Schema Migration

**Files:**
- Create: `supabase/migrations/20260514000001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

```sql
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
```

- [ ] **Step 2: Apply migration via Supabase SQL Editor**

1. Supabase dashboard → SQL Editor → New query
2. Paste the SQL above
3. Run
4. Verify: dashboard → Table Editor → see 6 tables

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260514000001_initial_schema.sql
git commit -m "feat: initial database schema"
```

---

## Task 7: Create RLS Policies Migration

**Files:**
- Create: `supabase/migrations/20260514000002_rls_policies.sql`

- [ ] **Step 1: Create RLS migration**

```sql
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
```

- [ ] **Step 2: Apply in SQL Editor**

Run the SQL in Supabase dashboard.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260514000002_rls_policies.sql
git commit -m "feat: RLS policies for tenant isolation"
```

---

## Task 8: Create Typed Env Module

**Files:**
- Create: `src/lib/env.ts`

- [ ] **Step 1: Write env module**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  RESEND_API_KEY: z.string().startsWith('re_'),
  RESEND_FROM_EMAIL: z.string().email(),
  GEMINI_API_KEY: z.string().min(10),
  SHOPIFY_STORE_DOMAIN: z.string().optional(),
  SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
  SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/env.ts
git commit -m "chore: typed env vars with zod"
```

---

## Task 9: Setup Resend + React Email

**Files:**
- Create: `src/lib/resend.ts`
- Create: `emails/verify-email.tsx`
- Create: `emails/welcome.tsx`

**External setup first:**

- [ ] **Step 1: Create Resend account**

1. https://resend.com → sign up (use Github)
2. Add domain (skip if no domain — use `onboarding@resend.dev` for hackathon dev)
3. Copy API key → `.env.local` → `RESEND_API_KEY=re_...`
4. Set `RESEND_FROM_EMAIL=onboarding@resend.dev`

- [ ] **Step 2: Create `src/lib/resend.ts`**

```typescript
import { Resend } from 'resend';
import { env } from './env';

export const resend = new Resend(env.RESEND_API_KEY);
```

- [ ] **Step 3: Create `emails/verify-email.tsx`**

```tsx
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from '@react-email/components';

interface VerifyEmailProps {
  businessName: string;
  verifyUrl: string;
}

export default function VerifyEmail({ businessName, verifyUrl }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>KOBİ Kaptanı'na hoş geldin — e-postanı doğrula</Preview>
      <Body style={{ fontFamily: 'sans-serif', background: '#0f0f10', color: '#fafafa', margin: 0 }}>
        <Container style={{ padding: '40px 24px', maxWidth: 600 }}>
          <Heading style={{ color: '#10b981' }}>⚓ KOBİ Kaptanı</Heading>
          <Text>Merhaba {businessName},</Text>
          <Text>
            5 sanal asistanından oluşan ekibin sana hoş geldin diyor.
            Devam etmek için e-posta adresini doğrula:
          </Text>
          <Button
            href={verifyUrl}
            style={{
              background: '#10b981',
              color: '#0f0f10',
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            E-postamı Doğrula
          </Button>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 32 }}>
            Bu e-postayı sen istemediysen yok say.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 4: Create `emails/welcome.tsx`**

```tsx
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from '@react-email/components';

export default function Welcome({ businessName }: { businessName: string }) {
  return (
    <Html>
      <Head />
      <Preview>Ekibin hazır — KOBİ Kaptanı seni bekliyor</Preview>
      <Body style={{ fontFamily: 'sans-serif', background: '#0f0f10', color: '#fafafa', margin: 0 }}>
        <Container style={{ padding: '40px 24px', maxWidth: 600 }}>
          <Heading style={{ color: '#10b981' }}>Hoş geldin, {businessName}! ⚓</Heading>
          <Text>
            Bugünden itibaren 5 sanal asistanın işini kolaylaştıracak:
          </Text>
          <Text>🔍 SEO Ajanı — başlıklarını optimize eder</Text>
          <Text>📢 Pazarlama Ajanı — sosyal medya içeriği üretir</Text>
          <Text>💰 Fiyat Ajanı — rakip fiyatlarını takip eder</Text>
          <Text>💬 Yorum Ajanı — müşteri yorumlarını analiz eder</Text>
          <Text>📊 Nakit Akışı Ajanı — finansal sağlığı izler</Text>
          <Text style={{ marginTop: 24 }}>Hazır olduğunda dashboard'a giriş yap.</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/resend.ts emails/
git commit -m "feat: resend email templates"
```

---

## Task 10: Setup Genkit + Gemini

**Files:**
- Create: `src/agents/genkit.ts`

- [ ] **Step 1: Get Gemini API key**

1. https://aistudio.google.com/apikey → Create API key
2. Add to `.env.local`: `GEMINI_API_KEY=...`

- [ ] **Step 2: Create `src/agents/genkit.ts`**

```typescript
import { genkit } from 'genkit';
import { googleAI, gemini20FlashExp } from '@genkit-ai/googleai';
import { env } from '@/lib/env';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: env.GEMINI_API_KEY }),
  ],
  model: gemini20FlashExp,
});

// Re-export commonly used model refs
export { gemini20FlashExp as flashModel } from '@genkit-ai/googleai';
// For Pro (Captain + Cash Flow), use the highest-quality Pro model available at impl time:
export { gemini20FlashExp as proModel } from '@genkit-ai/googleai';
// NOTE: Replace `gemini20FlashExp` for `proModel` with the latest Pro model ID once verified at runtime.
```

> **Implementation note:** Gemini model SDKs evolve quickly. Check `@genkit-ai/googleai` exports at install time and pick the latest available Pro model for `proModel`. The plan uses the SDK's named exports rather than string IDs.

- [ ] **Step 3: Smoke test Genkit init**

Create `scripts/test-genkit.ts`:

```typescript
import { ai } from '../src/agents/genkit';

async function main() {
  const { text } = await ai.generate('Tek kelimeyle: KOBİ Kaptanı sloganı ne olabilir?');
  console.log('Gemini cevabı:', text);
}

main().catch(console.error);
```

Run:
```bash
npx tsx scripts/test-genkit.ts
```

Expected: A Turkish slogan word.

- [ ] **Step 4: Delete the smoke test script and commit**

```bash
Remove-Item scripts/test-genkit.ts
git add src/agents/genkit.ts
git commit -m "feat: genkit + gemini initialization"
```

---

## Task 11: Setup Shopify Dev Store (External)

- [ ] **Step 1: Create Shopify Partner account**

1. https://partners.shopify.com → sign up
2. After signup: Stores → Add store → Development store
3. Name: `ayse-seramik-dev`
4. Store will be at: `ayse-seramik-dev.myshopify.com`

- [ ] **Step 2: Create custom app for API access**

1. Within the dev store admin → Apps → Develop apps → Create app
2. Name: `KOBI Kaptani`
3. Configure Admin API access:
   - Scopes: `read_products`, `write_products`, `read_orders`, `read_inventory`
4. Install app → reveal Admin API access token
5. Add to `.env.local`:
   - `SHOPIFY_STORE_DOMAIN=ayse-seramik-dev.myshopify.com`
   - `SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...`

- [ ] **Step 3: Add 10 demo products via Shopify admin**

1. Products → Add product (manually create 10):
   - "El Yapımı Mavi Vazo", "Seramik Kahve Fincanı", "Dekoratif Tabak Set", vs.
   - Add images, prices in TRY, descriptions in Turkish.
2. These will be the "real" Shopify products visible in our app.

- [ ] **Step 4: Test API access**

```powershell
$headers = @{ "X-Shopify-Access-Token" = $env:SHOPIFY_ADMIN_ACCESS_TOKEN }
Invoke-RestMethod "https://$env:SHOPIFY_STORE_DOMAIN/admin/api/2024-10/products.json" -Headers $headers
```

Expected: JSON with the 10 products.

---

## Task 12: Generate Mock Marketplace Data

**Files:**
- Create: `data/trendyol-competitors.json`
- Create: `data/hepsiburada-prices.json`
- Create: `data/n11-listings.json`
- Create: `scripts/seed-db.ts`

- [ ] **Step 1: Create `data/trendyol-competitors.json`**

```json
{
  "channel": "trendyol",
  "generated_at": "2026-05-14T12:00:00Z",
  "competitors": [
    {
      "keyword": "el yapımı vazo",
      "listings": [
        { "seller": "SeramikDunyasi", "title": "El Yapımı Dekoratif Mavi Vazo", "price": 289, "rating": 4.6, "review_count": 124 },
        { "seller": "AnatoliaCeramic", "title": "Handmade Blue Vase", "price": 320, "rating": 4.8, "review_count": 67 },
        { "seller": "VazoEvi", "title": "Mavi Vazo El İşi", "price": 245, "rating": 4.3, "review_count": 89 }
      ]
    },
    {
      "keyword": "seramik kahve fincanı",
      "listings": [
        { "seller": "FincanFabrikasi", "title": "Seramik Türk Kahvesi Fincanı", "price": 89, "rating": 4.5, "review_count": 312 },
        { "seller": "EvDekor", "title": "Handcrafted Coffee Cup", "price": 110, "rating": 4.7, "review_count": 56 }
      ]
    },
    {
      "keyword": "dekoratif tabak",
      "listings": [
        { "seller": "TabakDunyasi", "title": "Dekoratif Duvar Tabağı Set", "price": 450, "rating": 4.4, "review_count": 78 },
        { "seller": "SeramikSanat", "title": "Hand-painted Ceramic Plate", "price": 380, "rating": 4.9, "review_count": 23 }
      ]
    }
  ]
}
```

- [ ] **Step 2: Create `data/hepsiburada-prices.json`** (similar structure, 3 keywords × 3 listings)

```json
{
  "channel": "hepsiburada",
  "generated_at": "2026-05-14T12:00:00Z",
  "competitors": [
    {
      "keyword": "el yapımı vazo",
      "listings": [
        { "seller": "AtolyeShop", "title": "Premium El Yapımı Vazo", "price": 310, "rating": 4.5, "review_count": 45 },
        { "seller": "SeramikArt", "title": "Designer Vase Handmade", "price": 295, "rating": 4.4, "review_count": 67 }
      ]
    },
    {
      "keyword": "seramik kahve fincanı",
      "listings": [
        { "seller": "EvButik", "title": "Seramik Espresso Set", "price": 125, "rating": 4.3, "review_count": 134 }
      ]
    }
  ]
}
```

- [ ] **Step 3: Create `data/n11-listings.json`** (smaller dataset, 2 keywords)

```json
{
  "channel": "n11",
  "generated_at": "2026-05-14T12:00:00Z",
  "competitors": [
    {
      "keyword": "el yapımı vazo",
      "listings": [
        { "seller": "N11Premium", "title": "El Yapımı Çiçek Vazosu", "price": 270, "rating": 4.2, "review_count": 32 }
      ]
    }
  ]
}
```

- [ ] **Step 4: Create `scripts/seed-db.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import { env } from '../src/lib/env';

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function seed() {
  // 1. Create demo user (Ayşe Hanım)
  const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
    email: 'ayse@seramik.com',
    password: 'AyseDemo2026!',
    email_confirm: true,
    user_metadata: { business_name: 'Ayşe Seramik Atölyesi' },
  });
  if (signUpError) throw signUpError;
  if (!user) throw new Error('User not created');
  console.log('Created demo user:', user.id);

  // 2. Seed 30 products (vazo, fincan, tabak varieties)
  const productTemplates = [
    { name: 'El Yapımı Mavi Vazo', category: 'vazo', price: 280, cost: 120 },
    { name: 'Seramik Kahve Fincanı', category: 'fincan', price: 95, cost: 35 },
    { name: 'Dekoratif Tabak Set (4 li)', category: 'tabak', price: 420, cost: 180 },
    // ... expand to ~30 distinct products
  ];

  const products = [];
  for (const tpl of productTemplates) {
    products.push({
      profile_id: user.id,
      name: tpl.name,
      description: `Atölyede el yapımı ${tpl.category}, tek tek üretilir.`,
      current_price: tpl.price,
      cost_basis: tpl.cost,
      category: tpl.category,
      channels: ['shopify', 'trendyol', 'hepsiburada'],
    });
  }
  const { data: insertedProducts, error: pErr } = await supabase
    .from('products').insert(products).select();
  if (pErr) throw pErr;
  console.log(`Inserted ${insertedProducts.length} products`);

  // 3. Seed reviews (5 per product, mixed TR/EN, mixed sentiment)
  const reviewBodies = [
    { lang: 'tr', rating: 5, body: 'Harika bir ürün, çok kaliteli. Doğum günü hediyesi olarak aldım, çok beğenildi.' },
    { lang: 'tr', rating: 4, body: 'Güzel ama paketleme biraz daha iyi olabilirdi.' },
    { lang: 'tr', rating: 2, body: 'Kargo sırasında kırıldı, paketleme yetersizdi.' },
    { lang: 'en', rating: 5, body: 'Beautiful handcrafted piece. Love the quality.' },
    { lang: 'en', rating: 3, body: 'Nice but smaller than I expected.' },
  ];

  const reviews = [];
  for (const product of insertedProducts) {
    for (const r of reviewBodies) {
      reviews.push({
        product_id: product.id,
        channel: 'shopify',
        language: r.lang,
        rating: r.rating,
        body: r.body,
        posted_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }
  await supabase.from('reviews').insert(reviews);
  console.log(`Inserted ${reviews.length} reviews`);

  // 4. Seed sales (6 months back, ~5 sales/day average)
  const sales = [];
  const now = Date.now();
  for (let day = 0; day < 180; day++) {
    const date = new Date(now - day * 24 * 60 * 60 * 1000);
    const dailyCount = Math.floor(Math.random() * 8) + 2;
    for (let i = 0; i < dailyCount; i++) {
      const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      sales.push({
        profile_id: user.id,
        product_id: product.id,
        channel: ['shopify', 'trendyol', 'hepsiburada'][Math.floor(Math.random() * 3)],
        quantity,
        unit_price: product.current_price,
        total_revenue: product.current_price * quantity,
        occurred_at: date.toISOString(),
      });
    }
  }
  await supabase.from('sales').insert(sales);
  console.log(`Inserted ${sales.length} sales`);

  // 5. Seed expenses (next 90 days)
  const expenses = [
    { description: 'Hammadde alımı (kil + sır)', amount: 8500, category: 'hammadde', due_at_days: 12 },
    { description: 'Atölye kirası', amount: 6000, category: 'kira', due_at_days: 22 },
    { description: 'Elektrik faturası', amount: 1200, category: 'fatura', due_at_days: 18 },
    { description: 'Vergi (3 aylık)', amount: 4500, category: 'vergi', due_at_days: 45 },
    { description: 'Kargo anlaşması', amount: 2200, category: 'lojistik', due_at_days: 30 },
  ];
  await supabase.from('expenses').insert(
    expenses.map(e => ({
      profile_id: user.id,
      description: e.description,
      amount: e.amount,
      category: e.category,
      due_at: new Date(now + e.due_at_days * 24 * 60 * 60 * 1000).toISOString(),
      paid: false,
    }))
  );
  console.log('Inserted expenses');

  console.log('\n✅ Seed complete!');
  console.log('Login: ayse@seramik.com / AyseDemo2026!');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 5: Run seed**

```bash
npm run seed
```

Expected output:
```
Created demo user: <uuid>
Inserted N products
Inserted N reviews
Inserted N sales
Inserted expenses
✅ Seed complete!
```

- [ ] **Step 6: Verify in Supabase**

Supabase dashboard → Table Editor → check `products`, `reviews`, `sales`, `expenses` have rows.

- [ ] **Step 7: Commit**

```bash
git add data/ scripts/seed-db.ts
git commit -m "feat: mock marketplace data and DB seed script"
```

---

> **Faz 0 Milestone:** All infrastructure pieces wired. Genkit talks to Gemini, Supabase has demo data, Shopify dev store has 10 products, Resend templates ready. No UI yet — that's Faz 1.

---

# Faz 1 — Auth + Dashboard + İlk 3 Ajan (Day 1 PM + Day 2, ~12 saat)

## Task 13: Supabase Auth Client Setup

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Create `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component context — ignore set errors
          }
        },
      },
    }
  );
}
```

- [ ] **Step 2: Create `src/lib/supabase/client.ts`**

```typescript
'use client';
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

- [ ] **Step 3: Create `src/lib/supabase/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.includes('/login') || path.includes('/signup') || path.includes('/verify');
  const isDashboardRoute = path.includes('/dashboard') || /^\/(tr|en)\/?$/.test(path);

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/tr/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/tr/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: supabase auth clients (server, browser, middleware)"
```

---

## Task 14: Setup next-intl

**Files:**
- Create: `src/i18n.ts`
- Create: `src/messages/tr.json`
- Create: `src/messages/en.json`
- Create: `src/middleware.ts`

- [ ] **Step 1: Create `src/i18n.ts`**

```typescript
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'tr';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();
  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 2: Create `src/messages/tr.json`**

```json
{
  "nav": {
    "today": "Bugün",
    "chat": "Kaptan",
    "products": "Ürünler",
    "reviews": "Yorumlar",
    "cashflow": "Finans",
    "trace": "Trace",
    "settings": "Ayarlar",
    "logout": "Çıkış"
  },
  "auth": {
    "login": "Giriş Yap",
    "signup": "Kayıt Ol",
    "email": "E-posta",
    "password": "Şifre",
    "businessName": "İşletme Adı",
    "magicLink": "Magic Link Gönder",
    "noAccount": "Hesabın yok mu?",
    "haveAccount": "Hesabın var mı?",
    "tagline": "Beş asistan, bir kaptan, sıfır endişe."
  },
  "dashboard": {
    "greeting": "Günaydın",
    "briefTitle": "Günün Brief'i",
    "todayOrders": "Bugün Sipariş",
    "pendingReviews": "Bekleyen Yorum",
    "openActions": "Açık Aksiyon",
    "cashPosition": "Nakit Pozisyon",
    "viewDetails": "Detayları Gör",
    "talkToCaptain": "Kaptanla Konuş",
    "recentAgentActivity": "Son Ajan Aktivitesi"
  },
  "chat": {
    "placeholder": "Sor...",
    "send": "Gönder",
    "liveTrace": "Canlı Trace",
    "viewDetails": "Detayları gör"
  },
  "cashflow": {
    "title": "Nakit Akışı Projeksiyonu",
    "scenarioCurrent": "Mevcut",
    "scenarioDiscount": "%15 indirim",
    "scenarioCampaign": "Yeni kampanya",
    "askMarketing": "Pazarlama ajanına sor",
    "addScenario": "Yeni senaryo ekle"
  },
  "agents": {
    "captain": "Kaptan",
    "seo": "SEO",
    "marketing": "Pazarlama",
    "pricing": "Fiyat",
    "reviews": "Yorum",
    "cashflow": "Nakit"
  }
}
```

- [ ] **Step 3: Create `src/messages/en.json`** (mirror with English translations)

```json
{
  "nav": {
    "today": "Today",
    "chat": "Captain",
    "products": "Products",
    "reviews": "Reviews",
    "cashflow": "Finance",
    "trace": "Trace",
    "settings": "Settings",
    "logout": "Logout"
  },
  "auth": {
    "login": "Login",
    "signup": "Sign Up",
    "email": "Email",
    "password": "Password",
    "businessName": "Business Name",
    "magicLink": "Send Magic Link",
    "noAccount": "Don't have an account?",
    "haveAccount": "Already have an account?",
    "tagline": "Five assistants, one captain, zero worries."
  },
  "dashboard": {
    "greeting": "Good morning",
    "briefTitle": "Today's Brief",
    "todayOrders": "Today's Orders",
    "pendingReviews": "Pending Reviews",
    "openActions": "Open Actions",
    "cashPosition": "Cash Position",
    "viewDetails": "View Details",
    "talkToCaptain": "Talk to Captain",
    "recentAgentActivity": "Recent Agent Activity"
  },
  "chat": {
    "placeholder": "Ask...",
    "send": "Send",
    "liveTrace": "Live Trace",
    "viewDetails": "View details"
  },
  "cashflow": {
    "title": "Cash Flow Projection",
    "scenarioCurrent": "Current",
    "scenarioDiscount": "15% discount",
    "scenarioCampaign": "New campaign",
    "askMarketing": "Ask Marketing agent",
    "addScenario": "Add scenario"
  },
  "agents": {
    "captain": "Captain",
    "seo": "SEO",
    "marketing": "Marketing",
    "pricing": "Pricing",
    "reviews": "Reviews",
    "cashflow": "Cash Flow"
  }
}
```

- [ ] **Step 4: Create `src/middleware.ts`**

```typescript
import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { locales, defaultLocale } from '@/i18n';

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export async function middleware(request: NextRequest) {
  // Skip i18n for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    return updateSession(request);
  }

  // Apply i18n routing first
  const intlResponse = intlMiddleware(request);
  if (intlResponse.headers.get('location')) {
    return intlResponse;
  }

  // Then auth check
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 5: Commit**

```bash
git add src/i18n.ts src/messages/ src/middleware.ts
git commit -m "feat: next-intl setup with TR/EN + auth middleware"
```

---

## Task 15: Root Layout + Locale Layout

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Create root `src/app/layout.tsx`**

```tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KOBİ Kaptanı',
  description: 'Beş asistan, bir kaptan, sıfır endişe',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: Create `src/app/[locale]/layout.tsx`**

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { locales, type Locale } from '@/i18n';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create root redirect `src/app/[locale]/page.tsx`**

```tsx
import { redirect } from 'next/navigation';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}
```

- [ ] **Step 4: Smoke test**

```bash
npm run dev
```

Visit `http://localhost:3000` — should redirect to `/tr/login` (no auth → middleware redirects).

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/[locale]/layout.tsx src/app/[locale]/page.tsx
git commit -m "feat: root and locale layouts"
```

---

## Task 16: Auth Pages — Login + Signup

**Files:**
- Create: `src/app/[locale]/(auth)/layout.tsx`
- Create: `src/app/[locale]/(auth)/login/page.tsx`
- Create: `src/app/[locale]/(auth)/signup/page.tsx`
- Create: `src/app/[locale]/(auth)/login/actions.ts`
- Create: `src/app/[locale]/(auth)/signup/actions.ts`

- [ ] **Step 1: Auth split-screen layout `src/app/[locale]/(auth)/layout.tsx`**

```tsx
import { useTranslations } from 'next-intl';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth');
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-emerald-900/40 to-background">
        <div className="text-4xl">⚓</div>
        <div>
          <h1 className="text-5xl font-bold leading-tight">KOBİ<br/>Kaptanı</h1>
          <p className="mt-6 text-muted-foreground text-lg italic">"{t('tagline')}"</p>
        </div>
        <div className="text-sm text-muted-foreground">© 2026 KOBİ Kaptanı</div>
      </aside>
      <main className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Login server action `src/app/[locale]/(auth)/login/actions.ts`**

```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginWithPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }
  redirect('/tr/dashboard');
}

export async function loginWithMagicLink(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  return { ok: true };
}
```

- [ ] **Step 3: Login page `src/app/[locale]/(auth)/login/page.tsx`**

```tsx
'use client';
import { useTransition, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { loginWithPassword, loginWithMagicLink } from './actions';

export default function LoginPage() {
  const t = useTranslations('auth');
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState('');

  function handlePasswordLogin(formData: FormData) {
    startTransition(async () => {
      const result = await loginWithPassword(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleMagicLink() {
    const formData = new FormData();
    formData.append('email', email);
    startTransition(async () => {
      const result = await loginWithMagicLink(formData);
      if (result?.error) toast.error(result.error);
      else toast.success('Magic link gönderildi — e-postanı kontrol et');
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('login')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('tagline')}</p>
      </div>
      <form action={handlePasswordLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email" name="email" type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {t('login')}
        </Button>
      </form>
      <Button variant="outline" className="w-full" onClick={handleMagicLink} disabled={pending || !email}>
        ✉ {t('magicLink')}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        {t('noAccount')} <a href="/tr/signup" className="text-emerald-500 underline">{t('signup')}</a>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Signup server action `src/app/[locale]/(auth)/signup/actions.ts`**

```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resend } from '@/lib/resend';
import { env } from '@/lib/env';
import Welcome from '../../../../../emails/welcome';

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const businessName = formData.get('businessName') as string;

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { business_name: businessName } },
  });
  if (error) return { error: error.message };

  // Send welcome email (Resend)
  try {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'KOBİ Kaptanı\'na hoş geldin ⚓',
      react: Welcome({ businessName }),
    });
  } catch (e) {
    console.error('Welcome email failed:', e);
  }

  redirect('/tr/dashboard');
}
```

- [ ] **Step 5: Signup page `src/app/[locale]/(auth)/signup/page.tsx`**

```tsx
'use client';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { signup } from './actions';

export default function SignupPage() {
  const t = useTranslations('auth');
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await signup(formData);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('signup')}</h2>
      </div>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="businessName">{t('businessName')}</Label>
          <Input id="businessName" name="businessName" required />
        </div>
        <div>
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {t('signup')}
        </Button>
      </form>
      <p className="text-sm text-center text-muted-foreground">
        {t('haveAccount')} <a href="/tr/login" className="text-emerald-500 underline">{t('login')}</a>
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Auth callback `src/app/api/auth/callback/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/tr/dashboard`);
}
```

- [ ] **Step 7: Manual test**

```bash
npm run dev
```

1. Visit `http://localhost:3000` → redirected to `/tr/login`
2. Click signup link → fill form → submit
3. Expected: redirected to `/tr/dashboard` (still 404 — Task 17 builds this)
4. Or login with Ayşe demo creds: `ayse@seramik.com` / `AyseDemo2026!`

- [ ] **Step 8: Commit**

```bash
git add src/app/[locale]/'(auth)'/ src/app/api/auth/
git commit -m "feat: auth pages (login, signup, magic link)"
```

---

## Task 17: Dashboard Layout — Sidebar + Topbar

**Files:**
- Create: `src/app/[locale]/(dashboard)/layout.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/Topbar.tsx`
- Create: `src/components/LanguageToggle.tsx`

- [ ] **Step 1: Dashboard layout**

```tsx
// src/app/[locale]/(dashboard)/layout.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, preferred_language')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <Sidebar locale={locale} />
      <div className="flex-1 flex flex-col">
        <Topbar businessName={profile?.business_name ?? 'KOBİ Sahibi'} locale={locale} />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Sidebar component**

```tsx
// src/components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, MessageSquare, Package, MessageCircle, BarChart3, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { key: 'today', href: 'dashboard', icon: Home },
  { key: 'chat', href: 'dashboard/chat', icon: MessageSquare },
  { key: 'products', href: 'dashboard/products', icon: Package },
  { key: 'reviews', href: 'dashboard/reviews', icon: MessageCircle },
  { key: 'cashflow', href: 'dashboard/cashflow', icon: BarChart3 },
  { key: 'trace', href: 'dashboard/trace', icon: Activity },
];

export function Sidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <aside className="w-56 bg-card border-r flex flex-col">
      <div className="p-6 flex items-center gap-2">
        <span className="text-2xl">⚓</span>
        <span className="font-bold">KOBİ Kaptanı</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ key, href, icon: Icon }) => {
          const fullHref = `/${locale}/${href}`;
          const active = pathname === fullHref || (href === 'dashboard' && pathname === `/${locale}/dashboard`);
          return (
            <Link
              key={key} href={fullHref}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition',
                active ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-muted'
              )}
            >
              <Icon className="size-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <Link
          href={`/${locale}/dashboard/settings`}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted"
        >
          <Settings className="size-4" />
          {t('settings')}
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Topbar component**

```tsx
// src/components/Topbar.tsx
'use client';
import { LanguageToggle } from './LanguageToggle';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function Topbar({ businessName, locale }: { businessName: string; locale: string }) {
  const t = useTranslations('nav');
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-card">
      <div className="text-sm text-muted-foreground">{businessName}</div>
      <div className="flex items-center gap-3">
        <LanguageToggle currentLocale={locale} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><User className="size-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={logout}>
              <LogOut className="size-4 mr-2" /> {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Language toggle**

```tsx
// src/components/LanguageToggle.tsx
'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const locales = [{ code: 'tr', label: '🇹🇷 Türkçe' }, { code: 'en', label: '🇬🇧 English' }];

export function LanguageToggle({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    const newPath = pathname.replace(/^\/(tr|en)/, `/${newLocale}`);
    router.push(newPath);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="size-4" />
          {currentLocale === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => switchLocale(l.code)}>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/'(dashboard)'/layout.tsx src/components/Sidebar.tsx src/components/Topbar.tsx src/components/LanguageToggle.tsx
git commit -m "feat: dashboard shell (sidebar + topbar + language toggle)"
```

---

## Task 18: Dashboard "Bugün" Page (Skeleton)

**Files:**
- Create: `src/app/[locale]/(dashboard)/page.tsx`
- Create: `src/components/DashboardCard.tsx`
- Create: `src/components/BriefCard.tsx`

- [ ] **Step 1: DashboardCard component**

```tsx
// src/components/DashboardCard.tsx
import { Card, CardContent } from '@/components/ui/card';

export function DashboardCard({
  label, value, hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-3xl font-bold mt-1">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: BriefCard placeholder (real data in Task 28)**

```tsx
// src/components/BriefCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface BriefItem {
  status: 'ok' | 'warn' | 'critical' | 'info';
  text: string;
}

export function BriefCard({
  locale,
  items,
}: {
  locale: string;
  items: BriefItem[];
}) {
  const iconMap = { ok: '✓', warn: '⚠', critical: '🔴', info: 'ℹ' };
  const colorMap = {
    ok: 'text-emerald-500',
    warn: 'text-yellow-500',
    critical: 'text-red-500',
    info: 'text-blue-500',
  };

  return (
    <Card className="border-emerald-500/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Günün Brief'i</h2>
          <Badge variant="outline">5 ajan</Badge>
        </div>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={colorMap[item.status]}>{iconMap[item.status]}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-6">
          <Button asChild>
            <Link href={`/${locale}/dashboard/chat`}>Kaptanla Konuş →</Link>
          </Button>
          <Button variant="outline">Detayları Gör</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Dashboard page (skeleton with hardcoded data — real data in Task 28)**

```tsx
// src/app/[locale]/(dashboard)/page.tsx
import { createClient } from '@/lib/supabase/server';
import { DashboardCard } from '@/components/DashboardCard';
import { BriefCard } from '@/components/BriefCard';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Hardcoded brief — real captain integration in Task 28
  const brief = [
    { status: 'ok' as const, text: '3 ürünün SEO başlığı zayıf — taslak hazır' },
    { status: 'warn' as const, text: 'Vazo X için 4 negatif yorum (kırılma şikayeti)' },
    { status: 'info' as const, text: 'Rakipler 2 üründe %12 fiyat artırdı' },
    { status: 'ok' as const, text: 'Bu ay nakit pozisyon: GÜVENLİ 🟢' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Günaydın 👋</h1>

      <BriefCard locale={locale} items={brief} />

      <div className="grid grid-cols-4 gap-4">
        <DashboardCard label="Bugün Sipariş" value={12} />
        <DashboardCard label="Bekleyen Yorum" value={7} />
        <DashboardCard label="Açık Aksiyon" value={8} />
        <DashboardCard label="Nakit Pozisyon" value="🟢 OK" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Manual test**

```bash
npm run dev
```

Login → visit `/tr/dashboard` → see sidebar + topbar + brief card + 4 stat cards.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/'(dashboard)'/page.tsx src/components/DashboardCard.tsx src/components/BriefCard.tsx
git commit -m "feat: dashboard 'Bugün' page skeleton"
```

---

## Task 19: Shared Agent Schemas

**Files:**
- Create: `src/agents/schemas.ts`
- Create: `tests/unit/schemas.test.ts`

- [ ] **Step 1: Write failing test for schema validation**

```typescript
// tests/unit/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { SeoSuggestionSchema, PriceSuggestionSchema, BriefItemSchema } from '@/agents/schemas';

describe('SeoSuggestionSchema', () => {
  it('accepts a valid suggestion', () => {
    const valid = {
      productId: 'abc',
      oldTitle: 'mavi vazo',
      newTitle: 'El Yapımı Mavi Doğum Günü Hediyesi Vazo',
      reasoning: 'Keyword density iyileştirildi',
      expectedImpact: 'medium',
    };
    expect(SeoSuggestionSchema.parse(valid)).toEqual(valid);
  });

  it('rejects empty newTitle', () => {
    const invalid = { productId: 'a', oldTitle: 'x', newTitle: '', reasoning: 'y', expectedImpact: 'low' };
    expect(() => SeoSuggestionSchema.parse(invalid)).toThrow();
  });
});

describe('BriefItemSchema', () => {
  it('accepts known statuses', () => {
    for (const status of ['ok', 'warn', 'critical', 'info']) {
      expect(BriefItemSchema.parse({ status, text: 'test' }).status).toBe(status);
    }
  });
});
```

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 3: Run test — verify it fails (no schemas yet)**

```bash
npm test
```

Expected: FAIL (modules not found).

- [ ] **Step 4: Implement schemas**

```typescript
// src/agents/schemas.ts
import { z } from 'zod';

export const ImpactSchema = z.enum(['low', 'medium', 'high']);
export const StatusSchema = z.enum(['ok', 'warn', 'critical', 'info']);

export const SeoSuggestionSchema = z.object({
  productId: z.string(),
  oldTitle: z.string(),
  newTitle: z.string().min(1),
  reasoning: z.string(),
  expectedImpact: ImpactSchema,
  keywords: z.array(z.string()).optional(),
});

export const MarketingPostSchema = z.object({
  productId: z.string(),
  caption: z.string().min(1),
  hashtags: z.array(z.string()),
  imagePrompts: z.array(z.string()).min(1).max(5),
  optimalTime: z.string().optional(),
  tone: z.enum(['casual', 'professional', 'premium']),
});

export const PriceSuggestionSchema = z.object({
  productId: z.string(),
  currentPrice: z.number(),
  suggestedPrice: z.number(),
  range: z.tuple([z.number(), z.number()]),
  reasoning: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  expectedSalesChangePct: z.number().optional(),
});

export const SentimentBreakdownSchema = z.object({
  positive: z.number(),
  neutral: z.number(),
  negative: z.number(),
});

export const ReviewAnalysisSchema = z.object({
  productId: z.string(),
  totalReviews: z.number(),
  sentiment: SentimentBreakdownSchema,
  topThemes: z.array(z.object({
    theme: z.string(),
    count: z.number(),
    sentiment: z.enum(['positive', 'negative', 'mixed']),
  })),
  draftReplies: z.array(z.object({
    reviewId: z.string(),
    reply: z.string(),
  })).optional(),
});

export const CashFlowForecastSchema = z.object({
  scenario: z.string(),
  days: z.number(),
  projection: z.array(z.object({
    date: z.string(),
    balance: z.number(),
  })),
  riskScore: z.enum(['green', 'yellow', 'red']),
  commentary: z.string(),
  suggestedAction: z.string().optional(),
});

export const BriefItemSchema = z.object({
  status: StatusSchema,
  text: z.string(),
  source: z.string().optional(),
});

export const CaptainBriefSchema = z.object({
  greeting: z.string(),
  items: z.array(BriefItemSchema),
  topPriority: z.string().optional(),
});

// Trace metadata for UI rendering
export const TraceStepSchema = z.object({
  agent: z.enum(['captain', 'seo', 'marketing', 'pricing', 'reviews', 'cashflow']),
  action: z.string(),
  calledBy: z.string().optional(),
  durationMs: z.number().optional(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  timestamp: z.string(),
});

export type SeoSuggestion = z.infer<typeof SeoSuggestionSchema>;
export type MarketingPost = z.infer<typeof MarketingPostSchema>;
export type PriceSuggestion = z.infer<typeof PriceSuggestionSchema>;
export type ReviewAnalysis = z.infer<typeof ReviewAnalysisSchema>;
export type CashFlowForecast = z.infer<typeof CashFlowForecastSchema>;
export type BriefItem = z.infer<typeof BriefItemSchema>;
export type CaptainBrief = z.infer<typeof CaptainBriefSchema>;
export type TraceStep = z.infer<typeof TraceStepSchema>;
```

- [ ] **Step 5: Run test — verify PASS**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/agents/schemas.ts tests/unit/schemas.test.ts vitest.config.ts
git commit -m "feat: agent zod schemas with tests"
```

---

## Task 20: Shopify Admin API Tool

**Files:**
- Create: `src/lib/shopify.ts`
- Create: `src/agents/tools/shopify-tools.ts`

- [ ] **Step 1: Shopify client `src/lib/shopify.ts`**

```typescript
import { env } from './env';

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  variants: { id: number; price: string; sku: string }[];
  images: { src: string }[];
}

export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    return [];
  }
  const url = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/products.json?limit=50`;
  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
  const data = await res.json() as { products: ShopifyProduct[] };
  return data.products;
}

export async function fetchShopifyProduct(externalId: string): Promise<ShopifyProduct | null> {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_ADMIN_ACCESS_TOKEN) return null;
  const url = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/products/${externalId}.json`;
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN },
  });
  if (!res.ok) return null;
  const data = await res.json() as { product: ShopifyProduct };
  return data.product;
}
```

- [ ] **Step 2: Genkit tool wrappers `src/agents/tools/shopify-tools.ts`**

```typescript
import { z } from 'zod';
import { ai } from '../genkit';
import { fetchShopifyProducts, fetchShopifyProduct } from '@/lib/shopify';
import { createClient } from '@/lib/supabase/server';

export const listProductsTool = ai.defineTool(
  {
    name: 'listProducts',
    description: 'Returns the list of products owned by the current user (combines Supabase + Shopify dev store).',
    inputSchema: z.object({}),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      price: z.number().nullable(),
      category: z.string().nullable(),
      channels: z.array(z.string()),
    })),
  },
  async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('products').select('id, name, description, current_price, category, channels')
      .eq('profile_id', user.id);
    return (data ?? []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.current_price,
      category: p.category,
      channels: p.channels as string[],
    }));
  }
);

export const getProductTool = ai.defineTool(
  {
    name: 'getProduct',
    description: 'Gets full details of a specific product by ID.',
    inputSchema: z.object({ productId: z.string() }),
    outputSchema: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      price: z.number().nullable(),
      costBasis: z.number().nullable(),
      category: z.string().nullable(),
      images: z.array(z.string()),
      channels: z.array(z.string()),
    }).nullable(),
  },
  async ({ productId }) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('id, name, description, current_price, cost_basis, category, images, channels')
      .eq('id', productId).maybeSingle();
    if (!data) return null;
    return {
      id: data.id, name: data.name, description: data.description,
      price: data.current_price, costBasis: data.cost_basis,
      category: data.category,
      images: (data.images as string[]) ?? [],
      channels: data.channels as string[],
    };
  }
);
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/shopify.ts src/agents/tools/shopify-tools.ts
git commit -m "feat: shopify admin API client + product tools"
```

---

## Task 21: Marketplace Mock Adapter Tools

**Files:**
- Create: `src/agents/tools/marketplace-tools.ts`
- Create: `tests/unit/mock-adapters.test.ts`

- [ ] **Step 1: Test for marketplace adapter**

```typescript
// tests/unit/mock-adapters.test.ts
import { describe, it, expect } from 'vitest';
import { getCompetitorPrices } from '@/agents/tools/marketplace-tools';

describe('getCompetitorPrices', () => {
  it('returns competitors for matching keyword across all channels', async () => {
    const result = await getCompetitorPrices('el yapımı vazo');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(c => c.price > 0)).toBe(true);
    expect(new Set(result.map(c => c.channel)).size).toBeGreaterThanOrEqual(2);
  });

  it('returns empty array for unknown keyword', async () => {
    const result = await getCompetitorPrices('xyz123nonexistent');
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test (fails — module not yet built)**

```bash
npm test
```

- [ ] **Step 3: Implement marketplace tools**

```typescript
// src/agents/tools/marketplace-tools.ts
import { z } from 'zod';
import { ai } from '../genkit';
import fs from 'node:fs/promises';
import path from 'node:path';

interface Listing {
  seller: string;
  title: string;
  price: number;
  rating: number;
  review_count: number;
}

interface MarketplaceFile {
  channel: string;
  competitors: { keyword: string; listings: Listing[] }[];
}

async function loadFile(filename: string): Promise<MarketplaceFile> {
  const filePath = path.join(process.cwd(), 'data', filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function getCompetitorPrices(keyword: string) {
  const files = ['trendyol-competitors.json', 'hepsiburada-prices.json', 'n11-listings.json'];
  const result: { channel: string; seller: string; title: string; price: number; rating: number; reviewCount: number }[] = [];

  for (const filename of files) {
    try {
      const data = await loadFile(filename);
      const match = data.competitors.find(c => c.keyword.toLowerCase() === keyword.toLowerCase());
      if (match) {
        for (const listing of match.listings) {
          result.push({
            channel: data.channel,
            seller: listing.seller,
            title: listing.title,
            price: listing.price,
            rating: listing.rating,
            reviewCount: listing.review_count,
          });
        }
      }
    } catch (e) {
      console.error(`Failed to load ${filename}:`, e);
    }
  }
  return result;
}

export const competitorPricesTool = ai.defineTool(
  {
    name: 'getCompetitorPrices',
    description: 'Returns competitor listings (with prices) across Trendyol, Hepsiburada, N11 for a given product keyword.',
    inputSchema: z.object({ keyword: z.string() }),
    outputSchema: z.array(z.object({
      channel: z.string(),
      seller: z.string(),
      title: z.string(),
      price: z.number(),
      rating: z.number(),
      reviewCount: z.number(),
    })),
  },
  async ({ keyword }) => getCompetitorPrices(keyword)
);
```

- [ ] **Step 4: Run test — verify PASS**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/agents/tools/marketplace-tools.ts tests/unit/mock-adapters.test.ts
git commit -m "feat: marketplace mock adapter + competitor prices tool"
```

---

## Task 22: SEO Agent

**Files:**
- Create: `src/agents/seo.ts`

- [ ] **Step 1: Build SEO flow**

```typescript
// src/agents/seo.ts
import { z } from 'zod';
import { ai, flashModel } from './genkit';
import { SeoSuggestionSchema, type SeoSuggestion } from './schemas';
import { getProductTool, listProductsTool } from './tools/shopify-tools';

const SEO_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı" sisteminde SEO uzmanı bir ajansın. Görevin küçük işletmelerin
ürün başlık ve açıklamalarını arama motorları + pazaryeri algoritmaları için optimize etmek.

Karakterin: detay odaklı, veri-driven, Google'ın gözüyle bakar. Her kelimenin yeri vardır.

Kurallar:
- Başlıklar 60-70 karakteri geçmemeli (Google snippet limiti).
- Türkçe ürünler için Türkçe başlık, İngilizce ürünler için İngilizce.
- 2-3 ana keyword içersin (örn: "el yapımı" + "vazo" + "hediye").
- Marka/kategoriden çok ihtiyacı/kullanım amacını vurgula ("doğum günü hediyesi vazo" gibi).
- Gereksiz tıklama tuzakları yok ("EN İYİ", "MUTLAKA AL" yok).

Çıktın STRICT olarak SeoSuggestion JSON schemasına uymalı.`;

export const seoAgent = ai.defineFlow(
  {
    name: 'seoAgent',
    inputSchema: z.object({
      productId: z.string(),
      additionalContext: z.string().optional(), // peer agent'lardan ekstra bilgi
    }),
    outputSchema: SeoSuggestionSchema,
  },
  async ({ productId, additionalContext }) => {
    const product = await getProductTool({ productId });
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const userPrompt = `
Ürün: ${product.name}
Açıklama: ${product.description ?? '(yok)'}
Kategori: ${product.category ?? '(yok)'}
Kanallar: ${product.channels.join(', ')}
${additionalContext ? `\nEkstra bağlam (diğer ajanlardan):\n${additionalContext}` : ''}

Bu ürün için yeni bir SEO başlığı öner ve gerekçelendirir. Çıktıyı SeoSuggestion schema'sına uyacak şekilde JSON olarak ver.
    `.trim();

    const { output } = await ai.generate({
      model: flashModel,
      system: SEO_SYSTEM_PROMPT,
      prompt: userPrompt,
      output: { schema: SeoSuggestionSchema },
    });

    if (!output) throw new Error('SEO agent returned no output');
    return {
      ...output,
      productId, // ensure productId is set even if model omits it
      oldTitle: product.name,
    };
  }
);
```

- [ ] **Step 2: Smoke test via Genkit Dev UI**

```bash
npm run genkit:dev
```

Open Genkit Dev UI (default localhost:4000), find `seoAgent` flow, run with `{ "productId": "<one of seeded IDs>" }`. Verify SeoSuggestion output.

- [ ] **Step 3: Commit**

```bash
git add src/agents/seo.ts
git commit -m "feat: SEO agent flow"
```

---

## Task 23: Marketing Agent

**Files:**
- Create: `src/agents/marketing.ts`

- [ ] **Step 1: Build Marketing flow with peer A2A tool**

```typescript
// src/agents/marketing.ts
import { z } from 'zod';
import { ai, flashModel } from './genkit';
import { MarketingPostSchema } from './schemas';
import { getProductTool } from './tools/shopify-tools';
import { seoAgent } from './seo';

// Wrap seoAgent as a tool for peer A2A
const askSeoTool = ai.defineTool(
  {
    name: 'askSeoAgent',
    description: 'Asks the SEO agent for the optimized title and keywords for a product, so marketing content stays aligned.',
    inputSchema: z.object({ productId: z.string() }),
    outputSchema: z.object({
      title: z.string(),
      keywords: z.array(z.string()),
    }),
  },
  async ({ productId }) => {
    const result = await seoAgent({ productId });
    return {
      title: result.newTitle,
      keywords: result.keywords ?? [],
    };
  }
);

const MARKETING_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı" sisteminde pazarlama uzmanı bir ajansın. Görevin
sosyal medya (özellikle Instagram) için ürün postları üretmek.

Karakterin: yaratıcı, sıcak, marka sesini korur. Türk kullanıcısının dilini bilir.

Kurallar:
- Caption 100-220 karakter arası (Instagram optimal aralık).
- En az 5, en fazla 12 hashtag (mix: niş + popüler + marka).
- 3 farklı GÖRSEL PROMPTu üret (Gemini/DALL-E için), her biri farklı kompozisyon.
- Ton: kullanıcı 'casual' isterse samimi, 'professional' isterse kalite vurgulu, 'premium' isterse seçkin.
- Eğer SEO ajanından başlık/keywords aldıysan caption'da onlara değin.

GEREKLİDİR: Eğer henüz SEO bilgisi yoksa, askSeoAgent tool'unu çağırarak optimize başlığı ve keyword'ü al.`;

export const marketingAgent = ai.defineFlow(
  {
    name: 'marketingAgent',
    inputSchema: z.object({
      productId: z.string(),
      tone: z.enum(['casual', 'professional', 'premium']).default('casual'),
      campaign: z.string().optional(),
    }),
    outputSchema: MarketingPostSchema,
  },
  async ({ productId, tone, campaign }) => {
    const product = await getProductTool({ productId });
    if (!product) throw new Error(`Product not found: ${productId}`);

    const userPrompt = `
Ürün: ${product.name}
Açıklama: ${product.description ?? '(yok)'}
Kategori: ${product.category ?? '(yok)'}
Ton: ${tone}
${campaign ? `Kampanya: ${campaign}` : ''}

Bu ürün için Instagram postu hazırla. Eğer SEO bilgisi gerekirse askSeoAgent tool'unu çağır.
    `.trim();

    const { output } = await ai.generate({
      model: flashModel,
      system: MARKETING_SYSTEM_PROMPT,
      prompt: userPrompt,
      tools: [askSeoTool],
      output: { schema: MarketingPostSchema },
    });

    if (!output) throw new Error('Marketing agent returned no output');
    return { ...output, productId, tone };
  }
);
```

- [ ] **Step 2: Test in Genkit Dev UI**

Run `marketingAgent` flow with `{ "productId": "...", "tone": "casual" }`. Verify trace shows `askSeoAgent` peer call.

- [ ] **Step 3: Commit**

```bash
git add src/agents/marketing.ts
git commit -m "feat: marketing agent with peer A2A to SEO"
```

---

## Task 24: Pricing Agent

**Files:**
- Create: `src/agents/pricing.ts`

- [ ] **Step 1: Build Pricing flow**

```typescript
// src/agents/pricing.ts
import { z } from 'zod';
import { ai, flashModel } from './genkit';
import { PriceSuggestionSchema } from './schemas';
import { getProductTool } from './tools/shopify-tools';
import { competitorPricesTool } from './tools/marketplace-tools';

const PRICING_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı" sisteminde fiyatlandırma analisti bir ajansın.
Karakterin: analitik, soğukkanlı, sayılarla konuşur. "Sayılar yalan söylemez."

Görevin:
1. getCompetitorPrices tool'u ile rakip listelerini topla.
2. Kullanıcının current_price ve cost_basis bilgisine bakarak kâr marjını hesapla.
3. Önerilen fiyat aralığı belirle. Min marj %20 altına inme.
4. Risk değerlendir: indirim mi zam mı stable mi? Gerekçeli açıkla.

Kurallar:
- Eğer rakipler %10+ daha yüksekse fiyat artırma fırsatı varsa öner (riskLevel: low).
- Eğer rakipler %10+ daha düşükse, marjı koruyarak indirim öner veya value-add (riskLevel: medium).
- Eğer maliyet yakın → "fiyat sabit, kâr marjı dar" uyar (riskLevel: high).

JSON output: PriceSuggestion schema.`;

export const pricingAgent = ai.defineFlow(
  {
    name: 'pricingAgent',
    inputSchema: z.object({
      productId: z.string(),
      minMarginPct: z.number().default(20),
    }),
    outputSchema: PriceSuggestionSchema,
  },
  async ({ productId, minMarginPct }) => {
    const product = await getProductTool({ productId });
    if (!product) throw new Error(`Product not found: ${productId}`);
    if (!product.price || !product.costBasis) {
      throw new Error('Product missing price or cost basis');
    }

    const keyword = product.category ?? product.name.toLowerCase();

    const userPrompt = `
Ürün: ${product.name}
Mevcut fiyat: ${product.price} TL
Maliyet: ${product.costBasis} TL
Mevcut marj: %${((product.price - product.costBasis) / product.price * 100).toFixed(1)}
Min hedef marj: %${minMarginPct}
Kategori (rakip arama): "${keyword}"

Önce getCompetitorPrices tool'unu çağır ("${keyword}" ile), sonra analiz et ve PriceSuggestion JSON üret.
    `.trim();

    const { output } = await ai.generate({
      model: flashModel,
      system: PRICING_SYSTEM_PROMPT,
      prompt: userPrompt,
      tools: [competitorPricesTool],
      output: { schema: PriceSuggestionSchema },
    });

    if (!output) throw new Error('Pricing agent returned no output');
    return { ...output, productId, currentPrice: product.price };
  }
);
```

- [ ] **Step 2: Test in Dev UI**

Run `pricingAgent` with `{ "productId": "...", "minMarginPct": 25 }`. Verify competitor prices tool was called.

- [ ] **Step 3: Commit**

```bash
git add src/agents/pricing.ts
git commit -m "feat: pricing agent with competitor analysis"
```

---

## Task 25: Captain Orchestrator Agent

**Files:**
- Create: `src/agents/captain.ts`

- [ ] **Step 1: Build Captain flow**

```typescript
// src/agents/captain.ts
import { z } from 'zod';
import { ai, proModel } from './genkit';
import { CaptainBriefSchema, type CaptainBrief } from './schemas';
import { listProductsTool, getProductTool } from './tools/shopify-tools';
import { seoAgent } from './seo';
import { marketingAgent } from './marketing';
import { pricingAgent } from './pricing';

// Define agents as tools for Captain
const runSeoTool = ai.defineTool(
  {
    name: 'runSeoAgent',
    description: 'Runs the SEO specialist agent on a specific product. Returns title suggestion.',
    inputSchema: z.object({ productId: z.string() }),
    outputSchema: z.object({ newTitle: z.string(), reasoning: z.string() }),
  },
  async ({ productId }) => {
    const result = await seoAgent({ productId });
    return { newTitle: result.newTitle, reasoning: result.reasoning };
  }
);

const runMarketingTool = ai.defineTool(
  {
    name: 'runMarketingAgent',
    description: 'Runs the Marketing specialist agent. Generates Instagram caption + hashtags + image prompts.',
    inputSchema: z.object({
      productId: z.string(),
      tone: z.enum(['casual', 'professional', 'premium']).default('casual'),
    }),
    outputSchema: z.object({ caption: z.string(), hashtags: z.array(z.string()) }),
  },
  async ({ productId, tone }) => {
    const result = await marketingAgent({ productId, tone });
    return { caption: result.caption, hashtags: result.hashtags };
  }
);

const runPricingTool = ai.defineTool(
  {
    name: 'runPricingAgent',
    description: 'Runs the Pricing specialist agent. Returns competitor-aware price suggestion.',
    inputSchema: z.object({ productId: z.string() }),
    outputSchema: z.object({
      suggestedPrice: z.number(),
      reasoning: z.string(),
      riskLevel: z.string(),
    }),
  },
  async ({ productId }) => {
    const result = await pricingAgent({ productId });
    return {
      suggestedPrice: result.suggestedPrice,
      reasoning: result.reasoning,
      riskLevel: result.riskLevel,
    };
  }
);

const CAPTAIN_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı"sın — küçük işletme sahibinin sağ kolu, lider asistan.
Karakterin: profesyonel, lider, "ekibe nasıl en iyi sonucu aldırır?" mantığıyla çalışır.

Sahip olduğun uzman ajanlar (tool olarak çağırabilirsin):
- runSeoAgent: ürün başlığını optimize eder
- runMarketingAgent: sosyal medya postu üretir
- runPricingAgent: rakip fiyatlarına göre fiyat önerir
- listProducts: kullanıcının tüm ürünlerini listeler
- getProduct: bir ürünün detaylarını gösterir

Görevin:
1. Kullanıcının doğal dil sorusunu anla ve hangi uzman(lar)ı çağırman gerektiğini düşün.
2. Gerekiyorsa birden çok uzmanı paralel çağır (kod yapısı buna izin verir).
3. Sonuçları kullanıcıya OKUNABILIR, ÖZ, ve EYLEME GEÇİRİLEBİLİR şekilde sun.
4. Cevabını schema'ya uygun yapılandır.

Kullanıcının dilini takip et: kullanıcı Türkçe yazarsa Türkçe, İngilizce yazarsa İngilizce yanıt ver.

Eğer kullanıcı "bu hafta ne yapmalıyım?" gibi geniş bir soru sorarsa:
- En kritik 3 ürünü belirle (listProducts ile)
- Her biri için en kritik 1 aksiyon öner
- Kısa brief halinde sun`;

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
```

- [ ] **Step 2: Test Captain in Dev UI**

Run `captainAgent` with `{ "query": "Vazo X için lansman hazırla", "userLanguage": "tr" }`. Verify trace shows multiple agent tool calls.

- [ ] **Step 3: Commit**

```bash
git add src/agents/captain.ts
git commit -m "feat: captain orchestrator agent with peer A2A"
```

---

## Task 26: Agent API Route (Streaming)

**Files:**
- Create: `src/app/api/agent/route.ts`

- [ ] **Step 1: Build streaming endpoint**

```typescript
// src/app/api/agent/route.ts
import { createClient } from '@/lib/supabase/server';
import { captainAgent } from '@/agents/captain';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs'; // CRITICAL: Genkit requires Node, not Edge

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { query, locale } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const startTime = Date.now();
        const result = await captainAgent({ query, userLanguage: locale ?? 'tr' });
        const durationMs = Date.now() - startTime;

        // Persist trace
        await supabase.from('agent_traces').insert({
          profile_id: user.id,
          query,
          trace_json: result as unknown as Record<string, unknown>,
          duration_ms: durationMs,
        });

        controller.enqueue(encoder.encode(JSON.stringify({ type: 'final', data: result }) + '\n'));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message }) + '\n'));
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

- [ ] **Step 2: Commit**

```bash
git add src/app/api/agent/route.ts
git commit -m "feat: agent streaming API route"
```

---

## Task 27: AgentChip + ChatPanel Components

**Files:**
- Create: `src/components/AgentChip.tsx`
- Create: `src/components/ChatPanel.tsx`

- [ ] **Step 1: AgentChip**

```tsx
// src/components/AgentChip.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
  captain: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  seo: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  marketing: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
  pricing: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  reviews: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  cashflow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
};

const icons: Record<string, string> = {
  captain: '⚓',
  seo: '🔍',
  marketing: '📢',
  pricing: '💰',
  reviews: '💬',
  cashflow: '📊',
};

const labels: Record<string, string> = {
  captain: 'Kaptan',
  seo: 'SEO',
  marketing: 'Pazarlama',
  pricing: 'Fiyat',
  reviews: 'Yorum',
  cashflow: 'Nakit',
};

export function AgentChip({ agent }: { agent: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1', styles[agent] ?? '')}>
      <span>{icons[agent]}</span>
      <span>{labels[agent]}</span>
    </Badge>
  );
}
```

- [ ] **Step 2: ChatPanel (streaming)**

```tsx
// src/components/ChatPanel.tsx
'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { AgentChip } from './AgentChip';
import { Send } from 'lucide-react';
import type { CaptainBrief } from '@/agents/schemas';

interface Message {
  role: 'user' | 'captain';
  text: string;
  brief?: CaptainBrief;
}

export function ChatPanel({ locale }: { locale: string }) {
  const t = useTranslations('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, startTransition] = useTransition();

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput('');

    startTransition(async () => {
      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, locale }),
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line);
            if (event.type === 'final') {
              setMessages(prev => [
                ...prev,
                {
                  role: 'captain',
                  text: event.data.greeting + '\n\n' + (event.data.topPriority ?? ''),
                  brief: event.data,
                },
              ]);
            } else if (event.type === 'error') {
              setMessages(prev => [...prev, { role: 'captain', text: `Hata: ${event.message}` }]);
            }
          }
        }
      } catch (e) {
        setMessages(prev => [...prev, { role: 'captain', text: 'Bağlantı hatası' }]);
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {pending && <ThinkingIndicator />}
        </div>
      </ScrollArea>
      <div className="border-t p-4 flex gap-2">
        <Input
          placeholder={t('placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <Button onClick={send} disabled={pending || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-emerald-500/10 rounded-lg px-4 py-2 max-w-[80%]">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AgentChip agent="captain" />
      </div>
      <Card>
        <CardContent className="pt-4">
          <p className="whitespace-pre-wrap">{message.text}</p>
          {message.brief?.items && (
            <ul className="mt-3 space-y-1">
              {message.brief.items.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span>{item.status === 'critical' ? '🔴' : item.status === 'warn' ? '⚠' : item.status === 'ok' ? '✓' : 'ℹ'}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <AgentChip agent="captain" />
      <span className="animate-pulse">Ajanlar düşünüyor...</span>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AgentChip.tsx src/components/ChatPanel.tsx
git commit -m "feat: AgentChip + streaming ChatPanel"
```

---

## Task 28: Chat Page + Wire Brief Card to Real Captain

**Files:**
- Create: `src/app/[locale]/(dashboard)/chat/page.tsx`
- Modify: `src/app/[locale]/(dashboard)/page.tsx` (call captain server-side)

- [ ] **Step 1: Chat page**

```tsx
// src/app/[locale]/(dashboard)/chat/page.tsx
import { ChatPanel } from '@/components/ChatPanel';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="h-[calc(100vh-8rem)] -m-8">
      <div className="grid grid-cols-3 h-full">
        <div className="col-span-2 border-r">
          <div className="p-4 border-b">
            <h1 className="font-semibold">Kaptan ile Sohbet</h1>
          </div>
          <ChatPanel locale={locale} />
        </div>
        <aside className="p-4">
          <h2 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Canlı Trace</h2>
          <p className="text-sm text-muted-foreground">Sorunu gönder, ajan zinciri burada görünür.</p>
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire Dashboard "Bugün" to call Captain with seed query**

```tsx
// src/app/[locale]/(dashboard)/page.tsx (replace entire file)
import { createClient } from '@/lib/supabase/server';
import { DashboardCard } from '@/components/DashboardCard';
import { BriefCard } from '@/components/BriefCard';
import { captainAgent } from '@/agents/captain';
import type { BriefItem } from '@/agents/schemas';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { count: orderCount } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .gte('occurred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true });

  // Get morning brief from Captain (cached to avoid every-pageload cost)
  let brief: BriefItem[];
  try {
    const captainResult = await captainAgent({
      query: locale === 'tr'
        ? 'Bu sabah için kısa brief: en kritik 4 madde, durum işaretlerini kullan.'
        : 'Morning brief for today: top 4 critical items, with status flags.',
      userLanguage: locale,
    });
    brief = captainResult.items.slice(0, 4);
  } catch (e) {
    // Fallback if Captain fails
    brief = [
      { status: 'info', text: 'Kaptan brief üretemedi, dashboard sınırlı modda' },
    ];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Günaydın 👋</h1>

      <BriefCard locale={locale} items={brief} />

      <div className="grid grid-cols-4 gap-4">
        <DashboardCard label="Bugün Sipariş" value={orderCount ?? 0} />
        <DashboardCard label="Bekleyen Yorum" value={reviewCount ?? 0} />
        <DashboardCard label="Açık Aksiyon" value={brief.filter(b => b.status !== 'ok').length} />
        <DashboardCard label="Nakit Pozisyon" value="🟢 OK" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Manual test**

`npm run dev` → login → dashboard. Brief'i Captain üretmeli (bekle ~5-10sn ilk yükleme). Chat sekmesinden "Mavi vazo için Instagram postu hazırla" yaz, cevap gel.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/'(dashboard)'/
git commit -m "feat: chat page + wire Captain to Bugün dashboard"
```

---

## Task 29: ProductCard + Products Page

**Files:**
- Create: `src/components/ProductCard.tsx`
- Create: `src/app/[locale]/(dashboard)/products/page.tsx`

- [ ] **Step 1: ProductCard**

```tsx
// src/components/ProductCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  name: string;
  price: number | null;
  category: string | null;
  channels: string[];
  imageUrl?: string;
}

export function ProductCard({ name, price, category, channels, imageUrl }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      {imageUrl ? (
        <div className="aspect-square bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-square bg-muted flex items-center justify-center text-4xl">
          🏺
        </div>
      )}
      <CardContent className="pt-4 space-y-2">
        <h3 className="font-medium line-clamp-2">{name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-emerald-500 font-bold">
            {price ? `₺${price.toFixed(2)}` : '—'}
          </span>
          {category && <Badge variant="outline" className="text-xs">{category}</Badge>}
        </div>
        <div className="flex gap-1 flex-wrap">
          {channels.map(ch => (
            <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Products page**

```tsx
// src/app/[locale]/(dashboard)/products/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/ProductCard';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, current_price, category, channels, images');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ürünler</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(products ?? []).map(p => (
          <ProductCard
            key={p.id}
            name={p.name}
            price={p.current_price}
            category={p.category}
            channels={(p.channels as string[]) ?? []}
            imageUrl={(p.images as string[])?.[0]}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ProductCard.tsx src/app/[locale]/'(dashboard)'/products/
git commit -m "feat: products page + ProductCard"
```

---

## Task 30: Manual Faz 1 Demo Smoke Test

- [ ] **Step 1: Run full demo flow**

```bash
npm run dev
```

Test akışı (Türkçe):
1. Login: `ayse@seramik.com` / `AyseDemo2026!`
2. Dashboard'da brief'i göründüğünü doğrula
3. 4 stat kartında gerçek veri (count) gözüküyor
4. Chat sekmesi → "Mavi Vazo için Instagram postu hazırla"
5. Cevap gelmeli (~5-15sn) — caption + hashtag içeren brief
6. Products sekmesi → 30 ürün card grid'de
7. Topbar → dil toggle → EN → UI string'leri değişmeli
8. Logout → login sayfasına dönmeli

- [ ] **Step 2: Fix bugs as they appear**

Ortak bug'lar:
- Genkit Pro model adı yanlış → check `@genkit-ai/googleai` package exports, update `genkit.ts`
- Supabase RLS engeller → service_role_key kullanılan yerleri kontrol et (sadece seed.ts'de)
- next-intl namespace mismatch → `tr.json` ve component arasında key uyumu

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: faz 1 smoke test bug fixes"
```

---

> **Faz 1 Milestone:** Auth + dashboard + 3 ajan + ChatPanel + Captain orchestration çalışıyor. Büyüme demo akışı (lansman hazırla) baştan sona test edilebilir.

---

# Faz 2 — Yorum Ajanı + Deploy + E2E (Day 3, ~8 saat)

## Task 31: Review Tools

**Files:**
- Create: `src/agents/tools/review-tools.ts`

- [ ] **Step 1: Review query tools**

```typescript
// src/agents/tools/review-tools.ts
import { z } from 'zod';
import { ai } from '../genkit';
import { createClient } from '@/lib/supabase/server';

export const getReviewsTool = ai.defineTool(
  {
    name: 'getReviews',
    description: 'Returns recent reviews for a product or all products in a date range.',
    inputSchema: z.object({
      productId: z.string().optional(),
      daysBack: z.number().default(90),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      productId: z.string(),
      channel: z.string(),
      language: z.string().nullable(),
      rating: z.number(),
      body: z.string(),
      postedAt: z.string().nullable(),
    })),
  },
  async ({ productId, daysBack }) => {
    const supabase = await createClient();
    const sinceDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from('reviews')
      .select('id, product_id, channel, language, rating, body, posted_at')
      .gte('posted_at', sinceDate);
    if (productId) query = query.eq('product_id', productId);
    const { data } = await query.limit(200);
    return (data ?? []).map(r => ({
      id: r.id, productId: r.product_id, channel: r.channel,
      language: r.language, rating: r.rating, body: r.body, postedAt: r.posted_at,
    }));
  }
);
```

- [ ] **Step 2: Commit**

```bash
git add src/agents/tools/review-tools.ts
git commit -m "feat: review query tools"
```

---

## Task 32: Reviews Agent (Multilingual)

**Files:**
- Create: `src/agents/reviews.ts`

- [ ] **Step 1: Build Reviews flow with multilingual handling**

```typescript
// src/agents/reviews.ts
import { z } from 'zod';
import { ai, flashModel } from './genkit';
import { ReviewAnalysisSchema } from './schemas';
import { getReviewsTool } from './tools/review-tools';

const REVIEWS_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı"nın yorum yöneticisi ajanısın.
Karakterin: empatik, dikkatli, "her yorumun arkasında bir insan var."

Görevin:
1. getReviews tool'u ile yorumları çek
2. Her yorumun DİLİNİ tespit et (Türkçe/İngilizce/diğer)
3. Sentiment'i hesapla (positive/neutral/negative, -1 ile 1 arası score)
4. TEMALARI çıkar (örnek: "kırılma", "paketleme", "doğum günü hediyesi")
5. Kullanıcı diline göre özet üret. Eğer yorum İngilizceyse, KULLANICIYA TÜRKÇE özetle, ama orijinali koru.
6. NEGATIF yorumlara (rating <= 3) taslak yanıt üret (kullanıcının diline göre).

JSON output: ReviewAnalysis schema.`;

export const reviewsAgent = ai.defineFlow(
  {
    name: 'reviewsAgent',
    inputSchema: z.object({
      productId: z.string().optional(),
      daysBack: z.number().default(90),
      userLanguage: z.string().default('tr'),
    }),
    outputSchema: ReviewAnalysisSchema,
  },
  async ({ productId, daysBack, userLanguage }) => {
    const userPrompt = `
Kullanıcı dili: ${userLanguage}
Hedef ürün: ${productId ?? 'tüm ürünler'}
Zaman aralığı: son ${daysBack} gün

Önce getReviews tool'unu çağır (productId varsa onunla, yoksa boş). Sonra analiz yap.
Yabancı dilde yorumları ${userLanguage === 'tr' ? 'Türkçe' : 'English'} özetle, orijinali sentimentde tut.
    `.trim();

    const { output } = await ai.generate({
      model: flashModel,
      system: REVIEWS_SYSTEM_PROMPT,
      prompt: userPrompt,
      tools: [getReviewsTool],
      output: { schema: ReviewAnalysisSchema },
    });

    if (!output) throw new Error('Reviews agent returned no output');
    return { ...output, productId: productId ?? 'all' };
  }
);
```

- [ ] **Step 2: Test in Dev UI**

Run with `{ "productId": "<seeded-id>", "userLanguage": "tr" }`. Verify EN reviews are summarized in TR.

- [ ] **Step 3: Commit**

```bash
git add src/agents/reviews.ts
git commit -m "feat: multilingual reviews agent"
```

---

## Task 33: Reviews Agent Peer Tools (SEO + Marketing integration)

**Files:**
- Modify: `src/agents/seo.ts` (add `askReviewsAgent` tool)
- Modify: `src/agents/marketing.ts` (add `askReviewsAgent` tool)

- [ ] **Step 1: Add review-keyword peer tool to SEO**

In `src/agents/seo.ts`, BEFORE `SEO_SYSTEM_PROMPT`:

```typescript
import { reviewsAgent } from './reviews';

const askReviewsForKeywordsTool = ai.defineTool(
  {
    name: 'askReviewsForKeywords',
    description: 'Asks the Reviews agent for the most common customer keywords/themes for a product, so SEO can use authentic language.',
    inputSchema: z.object({ productId: z.string() }),
    outputSchema: z.object({
      topThemes: z.array(z.string()),
      customerWords: z.array(z.string()),
    }),
  },
  async ({ productId }) => {
    const result = await reviewsAgent({ productId, daysBack: 90, userLanguage: 'tr' });
    return {
      topThemes: result.topThemes.map(t => t.theme),
      customerWords: result.topThemes.flatMap(t => t.theme.split(' ')),
    };
  }
);
```

Then update the system prompt to mention this tool, and add to `tools: [askReviewsForKeywordsTool]` in the `ai.generate` call.

- [ ] **Step 2: Same for Marketing — `askReviewsForCustomerLanguage` tool**

In `src/agents/marketing.ts`:

```typescript
import { reviewsAgent } from './reviews';

const askReviewsForLanguageTool = ai.defineTool(
  {
    name: 'askReviewsForCustomerLanguage',
    description: 'Asks the Reviews agent for actual customer wording, so marketing copy uses authentic language.',
    inputSchema: z.object({ productId: z.string() }),
    outputSchema: z.object({
      positivePhrases: z.array(z.string()),
      commonThemes: z.array(z.string()),
    }),
  },
  async ({ productId }) => {
    const result = await reviewsAgent({ productId, daysBack: 90, userLanguage: 'tr' });
    return {
      positivePhrases: result.topThemes.filter(t => t.sentiment === 'positive').map(t => t.theme),
      commonThemes: result.topThemes.map(t => t.theme),
    };
  }
);
```

Add to marketing's `tools: [...existing, askReviewsForLanguageTool]`.

- [ ] **Step 3: Commit**

```bash
git add src/agents/seo.ts src/agents/marketing.ts
git commit -m "feat: SEO + Marketing peer A2A tools to Reviews agent"
```

---

## Task 34: ReviewItem Component + Reviews Page

**Files:**
- Create: `src/components/ReviewItem.tsx`
- Create: `src/app/[locale]/(dashboard)/reviews/page.tsx`

- [ ] **Step 1: ReviewItem**

```tsx
// src/components/ReviewItem.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface ReviewItemProps {
  rating: number;
  body: string;
  language?: string | null;
  channel: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  postedAt?: string | null;
}

export function ReviewItem({ rating, body, language, channel, sentiment, postedAt }: ReviewItemProps) {
  const sentimentColor =
    sentiment === 'positive' ? 'text-emerald-500' :
    sentiment === 'negative' ? 'text-red-500' :
    'text-muted-foreground';

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-4 ${i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            {language && <Badge variant="outline" className="text-xs">{language.toUpperCase()}</Badge>}
            <Badge variant="secondary" className="text-xs">{channel}</Badge>
          </div>
        </div>
        <p className={`text-sm ${sentimentColor}`}>{body}</p>
        {postedAt && (
          <p className="text-xs text-muted-foreground">{new Date(postedAt).toLocaleDateString()}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Reviews page (with sentiment chart)**

```tsx
// src/app/[locale]/(dashboard)/reviews/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ReviewItem } from '@/components/ReviewItem';
import { reviewsAgent } from '@/agents/reviews';
import { Card, CardContent } from '@/components/ui/card';

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, body, language, channel, posted_at')
    .order('posted_at', { ascending: false })
    .limit(30);

  // Run reviews agent to get aggregate analysis
  let analysis;
  try {
    analysis = await reviewsAgent({ daysBack: 90, userLanguage: locale });
  } catch (e) {
    console.error('Reviews agent failed:', e);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yorumlar</h1>

      {analysis && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-4">Genel Duygu</h2>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-emerald-500/10 rounded p-3 text-center">
                <div className="text-2xl font-bold text-emerald-500">{analysis.sentiment.positive}</div>
                <div className="text-xs text-muted-foreground">Olumlu</div>
              </div>
              <div className="bg-muted rounded p-3 text-center">
                <div className="text-2xl font-bold">{analysis.sentiment.neutral}</div>
                <div className="text-xs text-muted-foreground">Nötr</div>
              </div>
              <div className="bg-red-500/10 rounded p-3 text-center">
                <div className="text-2xl font-bold text-red-500">{analysis.sentiment.negative}</div>
                <div className="text-xs text-muted-foreground">Olumsuz</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Öne Çıkan Temalar</h3>
              <div className="flex gap-2 flex-wrap">
                {analysis.topThemes.slice(0, 5).map(t => (
                  <span key={t.theme} className="px-2 py-1 bg-muted rounded text-xs">
                    {t.theme} ({t.count})
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {(reviews ?? []).map(r => (
          <ReviewItem
            key={r.id}
            rating={r.rating ?? 0}
            body={r.body}
            language={r.language}
            channel={r.channel}
            postedAt={r.posted_at}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ReviewItem.tsx src/app/[locale]/'(dashboard)'/reviews/
git commit -m "feat: reviews page with agent analysis"
```

---

## Task 35: First Vercel Deploy

- [ ] **Step 1: Push to GitHub**

If not pushed yet:
```bash
git remote add origin https://github.com/<your-username>/Hackathon26.git
git branch -M main
git push -u origin main
```

(If branch is `master`, rename: `git branch -M main && git push -u origin main`)

- [ ] **Step 2: Create Vercel project**

1. https://vercel.com → Import → select repo
2. Framework preset: Next.js (auto-detected)
3. Environment variables — paste all from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `GEMINI_API_KEY`
   - `SHOPIFY_STORE_DOMAIN`
   - `SHOPIFY_ADMIN_ACCESS_TOKEN`
   - `NEXT_PUBLIC_APP_URL` — will set to vercel URL after first deploy
4. Deploy

- [ ] **Step 3: First deploy will likely fail — common fixes**

Common errors:
1. **Edge runtime error on /api/agent**: confirm `export const runtime = 'nodejs'` in `route.ts`
2. **Module not found in serverless function**: add to `serverExternalPackages` in `next.config.ts`
3. **`@supabase/ssr` cookie errors**: ensure cookieStore is awaited

Fix and redeploy: `git commit + push` triggers auto-deploy.

- [ ] **Step 4: Update `NEXT_PUBLIC_APP_URL` to production URL**

In Vercel project settings, update `NEXT_PUBLIC_APP_URL` to e.g. `https://hackathon26-xxx.vercel.app` and redeploy.

- [ ] **Step 5: Update Supabase Auth redirect URLs**

Supabase dashboard → Authentication → URL Configuration:
- Site URL: `https://hackathon26-xxx.vercel.app`
- Redirect URLs: add `https://hackathon26-xxx.vercel.app/**`

- [ ] **Step 6: Verify on production**

Visit prod URL → login → dashboard. Chat with captain. All flows should work.

- [ ] **Step 7: Commit any fixes**

```bash
git add -A
git commit -m "fix: production deploy adjustments"
git push
```

---

## Task 36: Playwright Setup

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Install browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // for hackathon: deterministic order
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "chore: playwright config"
```

---

## Task 37: E2E — Auth Flow Test

**Files:**
- Create: `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Write auth test**

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/tr\/login/);
    await expect(page.locator('h2')).toContainText(/Giriş/);
  });

  test('logs in with seed credentials and redirects to dashboard', async ({ page }) => {
    await page.goto('/tr/login');
    await page.fill('input[name="email"]', 'ayse@seramik.com');
    await page.fill('input[name="password"]', 'AyseDemo2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/tr\/dashboard/);
    await expect(page.locator('h1')).toContainText(/Günaydın/);
  });

  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/tr/login');
    await page.fill('input[name="email"]', 'ayse@seramik.com');
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid/i')).toBeVisible({ timeout: 5000 });
  });
});
```

- [ ] **Step 2: Run E2E**

```bash
npm run test:e2e
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/auth.spec.ts
git commit -m "test(e2e): auth flow"
```

---

## Task 38: E2E — Chat with Captain Test

**Files:**
- Create: `tests/e2e/chat.spec.ts`

- [ ] **Step 1: Write chat test**

```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Captain chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tr/login');
    await page.fill('input[name="email"]', 'ayse@seramik.com');
    await page.fill('input[name="password"]', 'AyseDemo2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/tr\/dashboard/);
  });

  test('captain responds to a simple question', async ({ page }) => {
    await page.goto('/tr/dashboard/chat');
    await page.fill('input[placeholder*="Sor"]', 'Tüm ürünlerimi listele');
    await page.click('button:has(svg.lucide-send)');

    // Wait for streaming response (max 30s)
    await expect(
      page.locator('text=/Vazo|Fincan|Tabak|ürün/i')
    ).toBeVisible({ timeout: 30_000 });
  });
});
```

- [ ] **Step 2: Run and fix selectors as needed**

```bash
npm run test:e2e -- chat.spec
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/chat.spec.ts
git commit -m "test(e2e): captain chat flow"
```

---

> **Faz 2 Milestone:** Reviews agent works multilingually, Reviews UI shows sentiment + themes, production deployed, 2 E2E tests green.

---

# Faz 3 — Nakit Akışı + Trace UI + i18n Polish (Day 4, ~8 saat)

## Task 39: Forecast Utility (TDD)

**Files:**
- Create: `src/agents/tools/forecast.ts`
- Create: `tests/unit/forecast.test.ts`

- [ ] **Step 1: Write forecast tests first**

```typescript
// tests/unit/forecast.test.ts
import { describe, it, expect } from 'vitest';
import { movingAverage, projectCashFlow } from '@/agents/tools/forecast';

describe('movingAverage', () => {
  it('computes 7-day moving average', () => {
    const values = [10, 20, 30, 40, 50, 60, 70];
    expect(movingAverage(values, 7)).toBeCloseTo(40);
  });

  it('handles short arrays by using available length', () => {
    expect(movingAverage([10, 20], 7)).toBeCloseTo(15);
  });

  it('returns 0 for empty array', () => {
    expect(movingAverage([], 7)).toBe(0);
  });
});

describe('projectCashFlow', () => {
  it('projects forward N days using average daily revenue minus daily expense burn', () => {
    const result = projectCashFlow({
      currentBalance: 10000,
      dailyAvgRevenue: 500,
      dailyAvgExpense: 300,
      days: 30,
    });
    expect(result).toHaveLength(30);
    expect(result[0].balance).toBe(10000 + 500 - 300);
    expect(result[29].balance).toBe(10000 + 30 * (500 - 300));
  });

  it('handles negative projections', () => {
    const result = projectCashFlow({
      currentBalance: 1000,
      dailyAvgRevenue: 100,
      dailyAvgExpense: 200,
      days: 20,
    });
    expect(result[19].balance).toBeLessThan(0);
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test forecast
```

- [ ] **Step 3: Implement forecast utility**

```typescript
// src/agents/tools/forecast.ts
import { z } from 'zod';
import { ai } from '../genkit';
import { createClient } from '@/lib/supabase/server';

export function movingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0;
  const slice = values.slice(-Math.min(window, values.length));
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

interface ProjectInput {
  currentBalance: number;
  dailyAvgRevenue: number;
  dailyAvgExpense: number;
  days: number;
}

export function projectCashFlow({ currentBalance, dailyAvgRevenue, dailyAvgExpense, days }: ProjectInput) {
  const dailyNet = dailyAvgRevenue - dailyAvgExpense;
  const result: { date: string; balance: number }[] = [];
  const startDate = Date.now();
  for (let d = 1; d <= days; d++) {
    const balance = currentBalance + dailyNet * d;
    const date = new Date(startDate + d * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    result.push({ date, balance: Math.round(balance * 100) / 100 });
  }
  return result;
}

export const getSalesHistoryTool = ai.defineTool(
  {
    name: 'getSalesHistory',
    description: 'Returns sales for the last N days.',
    inputSchema: z.object({ days: z.number().default(90) }),
    outputSchema: z.array(z.object({
      date: z.string(),
      revenue: z.number(),
    })),
  },
  async ({ days }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('sales').select('total_revenue, occurred_at')
      .eq('profile_id', user.id)
      .gte('occurred_at', since);

    const byDay: Record<string, number> = {};
    for (const sale of data ?? []) {
      const day = sale.occurred_at.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + sale.total_revenue;
    }
    return Object.entries(byDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
);

export const getPendingExpensesTool = ai.defineTool(
  {
    name: 'getPendingExpenses',
    description: 'Returns upcoming unpaid expenses in next N days.',
    inputSchema: z.object({ days: z.number().default(90) }),
    outputSchema: z.array(z.object({
      description: z.string(),
      amount: z.number(),
      category: z.string().nullable(),
      dueAt: z.string(),
    })),
  },
  async ({ days }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('expenses').select('description, amount, category, due_at')
      .eq('profile_id', user.id)
      .eq('paid', false)
      .lte('due_at', until);
    return (data ?? []).map(e => ({
      description: e.description, amount: e.amount, category: e.category, dueAt: e.due_at,
    }));
  }
);
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/agents/tools/forecast.ts tests/unit/forecast.test.ts
git commit -m "feat: forecast utility + sales/expenses tools (TDD)"
```

---

## Task 40: Cash Flow Agent

**Files:**
- Create: `src/agents/cashflow.ts`

- [ ] **Step 1: Build Cash Flow flow**

```typescript
// src/agents/cashflow.ts
import { z } from 'zod';
import { ai, proModel } from './genkit';
import { CashFlowForecastSchema } from './schemas';
import { getSalesHistoryTool, getPendingExpensesTool, projectCashFlow, movingAverage } from './tools/forecast';
import { createClient } from '@/lib/supabase/server';

const CASHFLOW_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı"nın mali müşaviri ajansın.
Karakterin: muhafazakâr, "kötü ihtimali planla", risk uyarıcı.

Görevin:
1. getSalesHistory ile son N gün satışları çek
2. getPendingExpenses ile yaklaşan ödemeleri çek
3. Gelir/gider günlük ortalamalarını hesapla (sana sayılarla verilecek)
4. Senaryoya göre forecast hesabı YAPILACAK kodla, sen YORUMUNU yaz
5. Risk skoru: green (rahat), yellow (dikkat), red (kritik)
6. Aksiyon öner: gider erteleme, fiyat ayarı, kampanya zamanlaması

Önemli: hesaplamayı SEN yapmıyorsun, sadece YORUMLUYORSUN. Kod sana projeksiyon verisini hazırlayıp gönderecek.`;

export const cashFlowAgent = ai.defineFlow(
  {
    name: 'cashFlowAgent',
    inputSchema: z.object({
      scenario: z.enum(['current', 'discount15', 'campaign']).default('current'),
      days: z.number().default(90),
      userLanguage: z.string().default('tr'),
    }),
    outputSchema: CashFlowForecastSchema,
  },
  async ({ scenario, days, userLanguage }) => {
    // 1. Pull data
    const sales = await getSalesHistoryTool({ days });
    const expenses = await getPendingExpensesTool({ days });

    // 2. Compute current balance (sum of recent sales - paid expenses; simplified)
    const supabase = await createClient();
    const { data: salesAll } = await supabase
      .from('sales').select('total_revenue').eq('profile_id', (await supabase.auth.getUser()).data.user!.id);
    const currentBalance = (salesAll ?? []).reduce((s, r) => s + r.total_revenue, 0) -
      expenses.reduce((s, e) => s + e.amount, 0) * 0.3; // assume 30% of pending already factored

    // 3. Compute averages
    const salesValues = sales.map(s => s.revenue);
    const dailyAvgRevenue = movingAverage(salesValues, 30);
    const dailyAvgExpense = expenses.reduce((s, e) => s + e.amount, 0) / days;

    // 4. Apply scenario
    let adjustedRevenue = dailyAvgRevenue;
    if (scenario === 'discount15') adjustedRevenue = dailyAvgRevenue * 1.05; // assume 5% volume bump but 15% margin loss
    if (scenario === 'campaign') adjustedRevenue = dailyAvgRevenue * 1.25; // 25% bump

    const projection = projectCashFlow({
      currentBalance,
      dailyAvgRevenue: adjustedRevenue,
      dailyAvgExpense,
      days,
    });

    // 5. Determine risk
    const minBalance = Math.min(...projection.map(p => p.balance));
    const riskScore: 'green' | 'yellow' | 'red' =
      minBalance < 0 ? 'red' :
      minBalance < currentBalance * 0.3 ? 'yellow' : 'green';

    // 6. Ask Gemini for commentary
    const commentaryPrompt = `
Senaryo: ${scenario}
Mevcut bakiye: ${currentBalance.toFixed(0)} TL
Günlük ortalama gelir: ${adjustedRevenue.toFixed(0)} TL
Günlük ortalama gider: ${dailyAvgExpense.toFixed(0)} TL
${days} gün sonra projekte bakiye: ${projection[projection.length - 1].balance.toFixed(0)} TL
Minimum bakiye dönemi: ${minBalance.toFixed(0)} TL
Risk skoru: ${riskScore}

${userLanguage === 'tr' ? 'TÜRKÇE' : 'ENGLISH'} olarak 2-3 cümlelik yorum ve 1 aksiyon önerisi yaz.
    `.trim();

    const { text } = await ai.generate({
      model: proModel,
      system: CASHFLOW_SYSTEM_PROMPT,
      prompt: commentaryPrompt,
    });

    return {
      scenario,
      days,
      projection,
      riskScore,
      commentary: text,
      suggestedAction: text.split('.').slice(-2).join('.').trim(),
    };
  }
);
```

- [ ] **Step 2: Test in Dev UI**

Run with `{ "scenario": "discount15", "days": 90, "userLanguage": "tr" }`.

- [ ] **Step 3: Commit**

```bash
git add src/agents/cashflow.ts
git commit -m "feat: cash flow agent with forecast + commentary"
```

---

## Task 41: Wire Pricing → Cash Flow A2A

**Files:**
- Modify: `src/agents/pricing.ts`

- [ ] **Step 1: Add `consultCashFlow` tool**

In `pricing.ts`, before the flow:

```typescript
import { cashFlowAgent } from './cashflow';

const consultCashFlowTool = ai.defineTool(
  {
    name: 'consultCashFlow',
    description: 'Asks the Cash Flow agent: "if I change pricing this way, what is the financial impact?"',
    inputSchema: z.object({
      scenarioDescription: z.string(),
      simulatedScenario: z.enum(['current', 'discount15', 'campaign']),
    }),
    outputSchema: z.object({
      riskScore: z.string(),
      commentary: z.string(),
      projectedMinBalance: z.number(),
    }),
  },
  async ({ simulatedScenario }) => {
    const result = await cashFlowAgent({ scenario: simulatedScenario, days: 90, userLanguage: 'tr' });
    return {
      riskScore: result.riskScore,
      commentary: result.commentary,
      projectedMinBalance: Math.min(...result.projection.map(p => p.balance)),
    };
  }
);
```

Update prompt to mention this tool. Add to `tools: [...existing, consultCashFlowTool]`.

- [ ] **Step 2: Commit**

```bash
git add src/agents/pricing.ts
git commit -m "feat: pricing agent peer A2A to cash flow"
```

---

## Task 42: CashFlowChart Component

**Files:**
- Create: `src/components/CashFlowChart.tsx`

- [ ] **Step 1: Build chart with Recharts**

```tsx
// src/components/CashFlowChart.tsx
'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface CashFlowChartProps {
  data: { date: string; balance: number }[];
  riskScore: 'green' | 'yellow' | 'red';
}

export function CashFlowChart({ data, riskScore }: CashFlowChartProps) {
  const color = riskScore === 'red' ? '#ef4444' : riskScore === 'yellow' ? '#eab308' : '#10b981';

  return (
    <Card>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
            <YAxis tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => [`₺${value.toFixed(0)}`, 'Bakiye']}
              labelFormatter={(date) => date}
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="balance" stroke={color} fill="url(#cashGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CashFlowChart.tsx
git commit -m "feat: CashFlowChart component"
```

---

## Task 43: Cash Flow Page

**Files:**
- Create: `src/app/[locale]/(dashboard)/cashflow/page.tsx`
- Create: `src/app/[locale]/(dashboard)/cashflow/CashFlowClient.tsx`

- [ ] **Step 1: Server component (loads initial data)**

```tsx
// src/app/[locale]/(dashboard)/cashflow/page.tsx
import { cashFlowAgent } from '@/agents/cashflow';
import { CashFlowClient } from './CashFlowClient';

export default async function CashFlowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const initial = await cashFlowAgent({ scenario: 'current', days: 90, userLanguage: locale });
  return <CashFlowClient initial={initial} locale={locale} />;
}
```

- [ ] **Step 2: Client component with scenario toggle**

```tsx
// src/app/[locale]/(dashboard)/cashflow/CashFlowClient.tsx
'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { CashFlowChart } from '@/components/CashFlowChart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CashFlowForecast } from '@/agents/schemas';

type Scenario = 'current' | 'discount15' | 'campaign';

export function CashFlowClient({
  initial, locale,
}: {
  initial: CashFlowForecast;
  locale: string;
}) {
  const t = useTranslations('cashflow');
  const [data, setData] = useState(initial);
  const [scenario, setScenario] = useState<Scenario>('current');
  const [pending, startTransition] = useTransition();

  function switchScenario(next: Scenario) {
    if (next === scenario) return;
    setScenario(next);
    startTransition(async () => {
      const res = await fetch('/api/cashflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: next, locale }),
      });
      const result = await res.json();
      setData(result);
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📊 {t('title')}</h1>

      <CashFlowChart data={data.projection} riskScore={data.riskScore as 'green'|'yellow'|'red'} />

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3">Senaryolar</h3>
          <div className="flex gap-2">
            {(['current', 'discount15', 'campaign'] as Scenario[]).map(s => (
              <Button
                key={s}
                variant={scenario === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchScenario(s)}
                disabled={pending}
              >
                {t(`scenario${s.charAt(0).toUpperCase() + s.slice(1)}` as any)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{data.riskScore === 'red' ? '🔴' : data.riskScore === 'yellow' ? '⚠️' : '🟢'}</span>
            <div className="flex-1">
              <p className="text-sm whitespace-pre-wrap">{data.commentary}</p>
              {data.suggestedAction && (
                <p className="text-sm mt-2 font-medium text-emerald-500">→ {data.suggestedAction}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: API route for scenario re-run**

```typescript
// src/app/api/cashflow/route.ts
import { cashFlowAgent } from '@/agents/cashflow';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { scenario, locale } = await req.json();
  const result = await cashFlowAgent({ scenario, days: 90, userLanguage: locale ?? 'tr' });
  return NextResponse.json(result);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/'(dashboard)'/cashflow/ src/app/api/cashflow/
git commit -m "feat: cash flow page with scenario toggle"
```

---

## Task 44: AgentTimeline Component (Simple Version)

**Files:**
- Create: `src/components/AgentTimeline.tsx`

- [ ] **Step 1: Text-based timeline (Plan B — simpler than SVG)**

```tsx
// src/components/AgentTimeline.tsx
import { AgentChip } from './AgentChip';
import type { TraceStep } from '@/agents/schemas';

export function AgentTimeline({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="font-mono text-sm space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="text-muted-foreground text-xs w-20 tabular-nums">
            {new Date(step.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <AgentChip agent={step.agent} />
          <div className="flex-1">
            <span className="text-sm">{step.action}</span>
            {step.calledBy && (
              <span className="text-xs text-muted-foreground ml-2">
                ← {step.calledBy}
              </span>
            )}
          </div>
          {step.durationMs && (
            <span className="text-xs text-muted-foreground">
              {step.durationMs}ms
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Trace page**

```tsx
// src/app/[locale]/(dashboard)/trace/page.tsx
import { createClient } from '@/lib/supabase/server';
import { AgentTimeline } from '@/components/AgentTimeline';
import { Card, CardContent } from '@/components/ui/card';

export default async function TracePage() {
  const supabase = await createClient();
  const { data: traces } = await supabase
    .from('agent_traces')
    .select('id, query, trace_json, duration_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🔬 Agent Trace</h1>
      {(traces ?? []).map(trace => (
        <Card key={trace.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground italic">"{trace.query}"</div>
              <div className="text-xs text-muted-foreground">
                {trace.duration_ms}ms • {new Date(trace.created_at).toLocaleString('tr-TR')}
              </div>
            </div>
            {/* For simple version: just show the brief items as "steps" */}
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(trace.trace_json, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

> *Note: For richer timeline, extend agents to write structured TraceStep arrays into `trace_json`. For Faz 3 fallback we render JSON; for Faz 4 polish we can render `AgentTimeline` if we structure traces during agent execution.*

- [ ] **Step 3: Commit**

```bash
git add src/components/AgentTimeline.tsx src/app/[locale]/'(dashboard)'/trace/
git commit -m "feat: agent trace page (text timeline + JSON view)"
```

---

> **Faz 3 Milestone:** Cash Flow agent works, scenario toggle re-runs forecast live, trace page shows past agent runs.

---

# Faz 4 — Evals + Cila + Sunum (Day 5, ~8 saat)

## Task 45: Eval Datasets

**Files:**
- Create: `tests/evals/seo-eval.json`
- Create: `tests/evals/marketing-eval.json`
- Create: `tests/evals/pricing-eval.json`
- Create: `tests/evals/reviews-eval.json`
- Create: `tests/evals/cashflow-eval.json`

- [ ] **Step 1: SEO eval dataset (10 cases)**

```json
{
  "agent": "seo",
  "cases": [
    {
      "id": "seo-1",
      "input": { "productId": "<seed-id-1>" },
      "groundTruth": {
        "keywords": ["el yapımı", "vazo", "hediye"],
        "maxTitleLength": 70
      },
      "rubric": "Yeni başlık 60-70 char arası, en az 2 keyword içermeli."
    },
    {
      "id": "seo-2",
      "input": { "productId": "<seed-id-2>" },
      "groundTruth": {
        "keywords": ["seramik", "fincan", "kahve"],
        "maxTitleLength": 70
      },
      "rubric": "Türkçe başlık, kahve teması net görünmeli."
    }
  ]
}
```

> Generate 10 cases per agent — pattern repeats. Use real seeded product IDs (run `npm run seed` and copy IDs from Supabase).

- [ ] **Step 2: Marketing eval (10 cases, LLM-as-judge rubric)**

```json
{
  "agent": "marketing",
  "cases": [
    {
      "id": "mkt-1",
      "input": { "productId": "<seed-id-1>", "tone": "casual" },
      "rubric": {
        "captionLengthMin": 100,
        "captionLengthMax": 220,
        "hashtagsMin": 5,
        "hashtagsMax": 12,
        "imagePromptsExactly": 3,
        "qualityCriteria": [
          "Caption mentions product without being salesy",
          "Hashtags include at least 2 niche terms",
          "Image prompts vary in composition"
        ]
      }
    }
  ]
}
```

(Continue 9 more, mixing tones).

- [ ] **Step 3: Pricing eval (10 cases, numeric tolerance)**

```json
{
  "agent": "pricing",
  "cases": [
    {
      "id": "price-1",
      "input": { "productId": "<seed-id-1>", "minMarginPct": 20 },
      "groundTruth": {
        "minSuggestedPrice": 240,
        "maxSuggestedPrice": 320,
        "expectedRiskLevel": "low"
      },
      "rubric": "Suggested price in expected range; reasoning mentions competitor comparison."
    }
  ]
}
```

- [ ] **Step 4: Reviews eval (10 cases, sentiment accuracy)**

```json
{
  "agent": "reviews",
  "cases": [
    {
      "id": "rev-1",
      "input": { "productId": "<seed-id-1>", "daysBack": 90, "userLanguage": "tr" },
      "groundTruth": {
        "minPositiveCount": 1,
        "minNegativeCount": 0,
        "expectedThemes": ["paketleme", "hediye"]
      },
      "rubric": "At least 1 theme overlap with expectedThemes; sentiment totals sum to total reviews."
    }
  ]
}
```

- [ ] **Step 5: Cash Flow eval (10 cases, projection accuracy)**

```json
{
  "agent": "cashflow",
  "cases": [
    {
      "id": "cash-1",
      "input": { "scenario": "current", "days": 30, "userLanguage": "tr" },
      "groundTruth": {
        "expectedRiskScore": "green",
        "projectionLengthExactly": 30,
        "balanceMustHaveNumber": true
      },
      "rubric": "Risk score matches; projection has correct length; commentary is in Turkish."
    }
  ]
}
```

- [ ] **Step 6: Commit**

```bash
git add tests/evals/
git commit -m "test: eval datasets for 5 agents (50 cases total)"
```

---

## Task 46: Eval Runner Script

**Files:**
- Create: `scripts/run-evals.ts`

- [ ] **Step 1: Eval runner**

```typescript
// scripts/run-evals.ts
import { seoAgent } from '../src/agents/seo';
import { marketingAgent } from '../src/agents/marketing';
import { pricingAgent } from '../src/agents/pricing';
import { reviewsAgent } from '../src/agents/reviews';
import { cashFlowAgent } from '../src/agents/cashflow';
import fs from 'node:fs/promises';
import path from 'node:path';

interface EvalCase {
  id: string;
  input: any;
  groundTruth?: any;
  rubric: any;
}

interface EvalResult {
  caseId: string;
  passed: boolean;
  score: number; // 0..1
  output: any;
  reasoning: string;
  durationMs: number;
}

const agentMap = {
  seo: seoAgent,
  marketing: marketingAgent,
  pricing: pricingAgent,
  reviews: reviewsAgent,
  cashflow: cashFlowAgent,
};

async function runEvalsForAgent(agentName: keyof typeof agentMap): Promise<EvalResult[]> {
  const filePath = path.join(process.cwd(), 'tests/evals', `${agentName}-eval.json`);
  const file = JSON.parse(await fs.readFile(filePath, 'utf-8'));
  const cases: EvalCase[] = file.cases;
  const results: EvalResult[] = [];

  for (const c of cases) {
    const start = Date.now();
    try {
      const output = await (agentMap[agentName] as any)(c.input);
      const duration = Date.now() - start;
      const { passed, score, reasoning } = evaluate(agentName, c, output);
      results.push({ caseId: c.id, passed, score, output, reasoning, durationMs: duration });
      console.log(`[${agentName}] ${c.id}: ${passed ? '✓' : '✗'} (${(score * 100).toFixed(0)}%, ${duration}ms)`);
    } catch (err) {
      console.log(`[${agentName}] ${c.id}: ERROR — ${err instanceof Error ? err.message : err}`);
      results.push({
        caseId: c.id, passed: false, score: 0,
        output: null, reasoning: String(err), durationMs: Date.now() - start
      });
    }
  }
  return results;
}

function evaluate(agent: string, testCase: EvalCase, output: any): { passed: boolean; score: number; reasoning: string } {
  // Per-agent evaluation logic
  if (agent === 'seo') {
    const gt = testCase.groundTruth;
    const titleLengthOk = output.newTitle.length <= gt.maxTitleLength;
    const keywordMatches = gt.keywords.filter((kw: string) =>
      output.newTitle.toLowerCase().includes(kw.toLowerCase())
    ).length;
    const score = (titleLengthOk ? 0.5 : 0) + Math.min(0.5, keywordMatches / gt.keywords.length * 0.5);
    return { passed: score >= 0.7, score, reasoning: `length:${titleLengthOk}, kw:${keywordMatches}/${gt.keywords.length}` };
  }

  if (agent === 'marketing') {
    const r = testCase.rubric;
    const checks = [
      output.caption.length >= r.captionLengthMin,
      output.caption.length <= r.captionLengthMax,
      output.hashtags.length >= r.hashtagsMin && output.hashtags.length <= r.hashtagsMax,
      output.imagePrompts.length === r.imagePromptsExactly,
    ];
    const score = checks.filter(Boolean).length / checks.length;
    return { passed: score >= 0.75, score, reasoning: checks.map((c, i) => `${i}:${c}`).join(', ') };
  }

  if (agent === 'pricing') {
    const gt = testCase.groundTruth;
    const inRange = output.suggestedPrice >= gt.minSuggestedPrice && output.suggestedPrice <= gt.maxSuggestedPrice;
    const riskMatch = output.riskLevel === gt.expectedRiskLevel;
    const score = (inRange ? 0.7 : 0) + (riskMatch ? 0.3 : 0);
    return { passed: score >= 0.7, score, reasoning: `inRange:${inRange}, riskMatch:${riskMatch}` };
  }

  if (agent === 'reviews') {
    const gt = testCase.groundTruth;
    const themeOverlap = gt.expectedThemes.filter((t: string) =>
      output.topThemes.some((ot: any) => ot.theme.toLowerCase().includes(t.toLowerCase()))
    ).length;
    const sentimentValid = output.sentiment.positive + output.sentiment.neutral + output.sentiment.negative === output.totalReviews;
    const score = (sentimentValid ? 0.4 : 0) + (themeOverlap > 0 ? 0.6 : 0);
    return { passed: score >= 0.6, score, reasoning: `themes:${themeOverlap}, sentSum:${sentimentValid}` };
  }

  if (agent === 'cashflow') {
    const gt = testCase.groundTruth;
    const riskOk = output.riskScore === gt.expectedRiskScore;
    const lengthOk = output.projection.length === gt.projectionLengthExactly;
    const commentaryHasContent = output.commentary.length > 20;
    const score = (riskOk ? 0.4 : 0) + (lengthOk ? 0.4 : 0) + (commentaryHasContent ? 0.2 : 0);
    return { passed: score >= 0.7, score, reasoning: `risk:${riskOk}, len:${lengthOk}, commentary:${commentaryHasContent}` };
  }

  return { passed: false, score: 0, reasoning: 'Unknown agent' };
}

async function main() {
  const allResults: Record<string, EvalResult[]> = {};
  for (const agent of Object.keys(agentMap) as Array<keyof typeof agentMap>) {
    console.log(`\n=== Running evals for ${agent} ===`);
    allResults[agent] = await runEvalsForAgent(agent);
  }

  // Summary
  console.log('\n\n=== SUMMARY ===');
  let totalPass = 0, totalCases = 0;
  for (const [agent, results] of Object.entries(allResults)) {
    const pass = results.filter(r => r.passed).length;
    const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;
    console.log(`${agent}: ${pass}/${results.length} passed, avg score ${(avgScore * 100).toFixed(1)}%`);
    totalPass += pass;
    totalCases += results.length;
  }
  console.log(`\nOVERALL: ${totalPass}/${totalCases} (${(totalPass / totalCases * 100).toFixed(1)}%)`);

  // Persist
  const outPath = path.join(process.cwd(), 'tests/evals/results.json');
  await fs.writeFile(outPath, JSON.stringify(allResults, null, 2));
  console.log(`\nResults written to ${outPath}`);
}

main().catch(console.error);
```

- [ ] **Step 2: Run evals**

```bash
npm run evals
```

Expected: ~50 cases run, summary printed. `tests/evals/results.json` created.

- [ ] **Step 3: Iterate on failing cases**

For each <0.7 score: review agent prompt, tweak system instructions, re-run. Target overall >80%.

- [ ] **Step 4: Commit**

```bash
git add scripts/run-evals.ts tests/evals/results.json
git commit -m "feat: eval runner for 5 agents"
```

---

## Task 47: Evals Widget on Dashboard

**Files:**
- Modify: `src/app/[locale]/(dashboard)/page.tsx` (add evals card)

- [ ] **Step 1: Load and render evals score**

Add to dashboard page (after the 4-card grid):

```tsx
import fs from 'node:fs/promises';
import path from 'node:path';

async function loadEvalsScore() {
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'tests/evals/results.json'), 'utf-8');
    const data = JSON.parse(file);
    let totalScore = 0, totalCases = 0;
    for (const results of Object.values(data) as any[]) {
      for (const r of results) {
        totalScore += r.score;
        totalCases++;
      }
    }
    return { avgScore: totalScore / totalCases, totalCases };
  } catch {
    return null;
  }
}
```

In the JSX, add:

```tsx
{evalsScore && (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Ajan Doğruluk Skoru</span>
        <span className="text-xs text-muted-foreground">{evalsScore.totalCases} senaryo</span>
      </div>
      <div className="text-4xl font-bold text-emerald-500">
        {(evalsScore.avgScore * 100).toFixed(1)}%
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Genkit Evals ile ölçüldü • {evalsScore.totalCases} test case
      </p>
    </CardContent>
  </Card>
)}
```

Call `const evalsScore = await loadEvalsScore();` near the top.

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/'(dashboard)'/page.tsx
git commit -m "feat: evals score widget on dashboard"
```

---

## Task 48: E2E — Cash Flow Scenario Toggle Test

**Files:**
- Create: `tests/e2e/cashflow.spec.ts`

- [ ] **Step 1: Write test**

```typescript
// tests/e2e/cashflow.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tr/login');
  await page.fill('input[name="email"]', 'ayse@seramik.com');
  await page.fill('input[name="password"]', 'AyseDemo2026!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/tr\/dashboard/);
});

test('cash flow scenario toggle updates chart', async ({ page }) => {
  await page.goto('/tr/dashboard/cashflow');
  await expect(page.locator('h1')).toContainText(/Nakit/);

  // Switch to discount15
  await page.click('button:has-text("indirim")');

  // Chart re-renders — commentary changes
  await expect(page.locator('text=/risk|açık|kasa/i').first()).toBeVisible({ timeout: 30_000 });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/cashflow.spec.ts
git commit -m "test(e2e): cash flow scenario toggle"
```

---

## Task 49: E2E — i18n Toggle Test

**Files:**
- Create: `tests/e2e/i18n.spec.ts`

- [ ] **Step 1: i18n test**

```typescript
// tests/e2e/i18n.spec.ts
import { test, expect } from '@playwright/test';

test('language toggle switches UI strings', async ({ page }) => {
  await page.goto('/tr/login');
  await page.fill('input[name="email"]', 'ayse@seramik.com');
  await page.fill('input[name="password"]', 'AyseDemo2026!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/tr\/dashboard/);

  // Open language toggle
  await page.click('text=/TR/');
  await page.click('text=/English/');

  await expect(page).toHaveURL(/\/en\/dashboard/);
  await expect(page.locator('text=/Today/i').first()).toBeVisible({ timeout: 10000 });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/i18n.spec.ts
git commit -m "test(e2e): i18n toggle"
```

---

## Task 50: UI Polish Round — Loading States + Toasts

**Files:**
- Modify: Multiple `page.tsx` files
- Modify: `src/components/ChatPanel.tsx`

- [ ] **Step 1: Add loading skeletons to all dashboard data fetches**

Wherever you have `await captainAgent(...)` or other slow agent calls, wrap in `<Suspense fallback={<SkeletonCard />}>`:

Create `src/components/SkeletonCard.tsx`:
```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Toast errors in ChatPanel**

In `ChatPanel.tsx`, replace any `setMessages(prev => [...prev, { role: 'captain', text: 'Hata: ...' }])` with:
```typescript
import { toast } from 'sonner';
// ...
toast.error(event.message);
```

- [ ] **Step 3: Smooth hover states**

In `Sidebar.tsx`, add `transition-colors duration-200` to nav links. In `Card` (already done in shadcn).

- [ ] **Step 4: Commit**

```bash
git add src/components/ src/app/
git commit -m "feat: UI polish (skeletons, toasts, transitions)"
```

---

## Task 51: Demo Data Refresh Script

**Files:**
- Create: `scripts/refresh-demo-data.ts`

- [ ] **Step 1: Make seed dates rolling**

Modify `scripts/seed-db.ts` to use `Date.now()` for relative dates (already done in our seed). Run before demo:

```bash
npm run seed
```

This ensures sales dates are "fresh" relative to today (not 2 weeks old).

- [ ] **Step 2: Commit**

(Nothing new — just verify).

---

## Task 52: Demo Video Recording

- [ ] **Step 1: Prepare demo environment**

1. Run `npm run seed` to refresh dates
2. Open prod URL in clean browser (Incognito or fresh profile)
3. Increase zoom to ~125% (visible to viewers)
4. Pre-login (so demo starts at dashboard)
5. Open 2nd tab: Genkit Dev UI (`npm run genkit:dev` in another terminal)
6. Open 3rd tab: Gmail (welcome email screenshot)

- [ ] **Step 2: Record with Loom / OBS (3 minutes target)**

Script:
1. **0:00-0:10** — Show dashboard, brief card, 4 stat cards, evals score widget
2. **0:10-1:00** — Chat: "Vazo X için lansman hazırla" → show streaming response, point to right-side trace
3. **1:00-1:50** — Chat: "Vazo X fiyatını %15 düşüreyim mi?" → highlight A2A in trace (Pricing→CashFlow, Pricing→Reviews)
4. **1:50-2:30** — Switch to Cash Flow page → toggle scenarios → show chart change + commentary
5. **2:30-2:50** — Language toggle TR → EN, show UI changes
6. **2:50-3:00** — Outro card with URL + GitHub

- [ ] **Step 3: Upload to YouTube (unlisted)**

Copy public link → save for submission.

---

## Task 53: Presentation Slides

- [ ] **Step 1: Create 8 slides (Keynote/Google Slides/Pitch)**

Per the design doc Bölüm 13:

1. "Ayşe Hanım'ın Bir Salı Günü" — composite screenshot of 5 tabs
2. Problem — "80 ürün, 3 kanal, 1 kişi"
3. "Bir kaptan, beş asistan" — simplified architecture diagram
4. **CANLI DEMO** (embedded video or live)
5. "Ajanlar Birbiriyle Konuşuyor" — Genkit trace screenshot
6. "Ölçtük, çalışıyor" — Evals score table
7. Roadmap + Vizyon
8. Teşekkür + QR code with prod URL

- [ ] **Step 2: Export as PDF**

Save `kobi-kaptani-sunum.pdf` for submission backup.

---

## Task 54: README + Submission Package

**Files:**
- Create/Modify: `README.md`

- [ ] **Step 1: README**

```markdown
# ⚓ KOBİ Kaptanı

> Multi-agent AI ekibi: küçük işletmeciler için 5 sanal asistan, 1 kaptan.

[**Demo Video**](<YouTube URL>) • [**Canlı Uygulama**](<Vercel URL>) • [**Tasarım Dokümanı**](./docs/superpowers/specs/2026-05-14-kobi-kaptani-design.md)

## Demo Kullanıcı
- E-posta: `ayse@seramik.com`
- Şifre: `AyseDemo2026!`

## Hızlı Başlangıç

```bash
# 1. Install deps
npm install

# 2. .env.local doldur (Supabase, Resend, Gemini, Shopify keys)
cp .env.example .env.local

# 3. DB seed
npm run seed

# 4. Dev server + Genkit Dev UI
npm run dev
npm run genkit:dev   # ayrı terminalde

# 5. Testler
npm test                # Vitest unit
npm run test:e2e        # Playwright
npm run evals           # Genkit Evals
```

## Mimari

5 Genkit flow ajansı + 1 orchestrator. Detay: [Design Doc](./docs/superpowers/specs/2026-05-14-kobi-kaptani-design.md).

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- Genkit + Gemini (Pro for Captain/CashFlow, Flash for specialists)
- Supabase (Auth + Postgres + RLS)
- Resend + React Email
- next-intl (TR/EN)
- Recharts
- Vitest + Playwright + Genkit Evals
- Vercel deploy

## Sonuçlar

- 5 ajan, 50 eval senaryo, ortalama doğruluk: `{EVAL_SCORE}`%
- Production URL: `<Vercel URL>`
- ~3500 satır TypeScript, solo geliştirme, 5 gün

## Lisans

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with demo links and quickstart"
git push
```

- [ ] **Step 3: Final submission checklist**

- [ ] Production URL erişilebilir (test from clean browser)
- [ ] GitHub repo public
- [ ] Demo video YouTube'da unlisted
- [ ] Sunum slidelar PDF export
- [ ] Evals results.json commit edildi
- [ ] README link'leri test edildi
- [ ] Tüm seed verisi taze (sales tarihleri eski değil)

---

## Task 55: Demo Provası

- [ ] **Step 1: Tam akış provası ×5**

Senaryo (her seferinde aynı):
1. Slide 1-3 anlatım (1:30)
2. Demo (3:30):
   - Dashboard brief + evals widget
   - Chat: "Vazo X için lansman" (büyüme)
   - Chat: "%15 indirim" (A2A vurgu)
   - Cash flow scenario toggle (finans)
   - i18n toggle (multilingual)
3. Slide 5-7 kapanış (1:30)
4. Q&A (2:00)

Total: ~7-8 dakika.

- [ ] **Step 2: Zamanı tut**

Her provada saat. Eğer 8 dakikayı aşıyorsa, A2A bölümünü kısalt.

- [ ] **Step 3: Backup planı**

Eğer canlı demo bug çıkarsa: önceden kaydedilmiş demo video'yu yedek olarak hazırda tut.

---

> **Faz 4 Milestone:** Submission package hazır, demo video çekildi, slidelar bitti, evals raporu var, 4 E2E test geçiyor, prod URL stabil.

---

# Risk Buffer & Cuttable Items

Eğer Day 5'te zaman sıkışırsa, sırasıyla kes:

1. **Eval cases**: 50 → 25 (5 per agent yerine 2-3)
2. **i18n EN cilası**: TR tam kalsın, EN bozuk olabilir
3. **Cross-browser Playwright**: sadece Chromium
4. **Agent Trace görselleştirme**: JSON view kalsın, swimlane SVG vazgeç
5. **Loading skeletons**: bazı sayfalarda atla
6. **Final cila**: hover transitions, animation kes

---

# Glossary

- **Genkit:** Google'ın AI/agent geliştirme framework'ü. Flow = ajan, Tool = ajanların çağırabileceği fonksiyon, Dev UI = tarayıcıda trace görselleştirme.
- **A2A (Agent-to-Agent):** Bir ajan başka bir ajanı tool olarak çağırması. Bu projede Hibrit C deseninin temeli.
- **Faz:** Iteratif gün öbeği. Faz 0 setup, 1-3 ajan ekleme, 4 cila.
- **RLS:** Supabase Row-Level Security. Kullanıcı sadece kendi `profile_id`'sine ait satırları görür/yazabilir.
- **Magic Link:** Supabase Auth'un email tabanlı şifresiz giriş yöntemi. Demo'da Resend ile branded gönderilir.
- **Eval:** Ajan çıktısını ground truth/rubric'e karşı değerlendiren benchmark.

