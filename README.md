# ⚓ KOBİ Kaptanı

> **Beş asistan, bir kaptan, sıfır endişe.**

Multi-agent yapay zeka uygulaması — çok kanallı satış yapan küçük işletmeler için 5 sanal uzman ajan ve bir Kaptan orchestrator. Ajanlar birbiriyle otomatik konuşur (Agent-to-Agent / A2A), kullanıcıya birleşik bir günlük brief ve aksiyon önerisi sunar.

**Gemini AI Hackathon 2026 — Finans & E-ticaret teması**

---

## 🎬 Demo

| | |
|---|---|
| **Production URL** | _(deploy sonrası burada olacak)_ |
| **Demo Video** | _(YouTube link)_ |
| **Demo kullanıcı** | `ayse@seramik.com` / `AyseDemo2026!` |
| **Persona** | Ayşe Hanım, El Yapımı Seramik Atölyesi sahibi |

---

## 🤖 Ajan Mimarisi (Hibrit C: Orchestrator + Peer-to-Peer A2A)

```
                     [ Kaptan Ajan (Gemini 2.5 Pro) ]
                                  │
       ┌──────────┬───────────────┼──────────────┬──────────┐
       │          │               │              │          │
     [SEO]    [Pazarlama]      [Fiyat]        [Yorum]    [Nakit]

   Her uzman ajan, gerektiğinde DİĞER uzman ajanları "tool" olarak çağırır:

   • Pazarlama → SEO (başlık/keyword paylaşımı)
   • Pazarlama → Yorum (müşteri dilini kullan)
   • SEO → Yorum (keyword extraction)
   • Fiyat → Nakit (finansal etki simülasyonu)
   • Fiyat → Rakip API (mock pazaryeri data)
   • Kaptan → tüm uzmanlar (orchestration)
```

### 5 Uzman Ajan

| Ajan | Görev | Model |
|---|---|---|
| 🔍 **SEO** | Ürün başlığı/açıklama/etiket optimizasyonu | Gemini 2.5 Flash |
| 📢 **Pazarlama** | Instagram caption + görsel prompt + hashtag | Gemini 2.5 Flash |
| 💰 **Fiyat** | Rakip-aware dinamik fiyat önerisi | Gemini 2.5 Flash |
| 💬 **Yorum** | Multilingual sentiment analizi + tema çıkarma | Gemini 2.5 Flash |
| 📊 **Nakit Akışı** | 30/60/90 gün forecast + senaryo simülasyonu | Gemini 2.5 Pro |
| ⚓ **Kaptan** | Orchestrator, multi-agent koordinasyon | Gemini 2.5 Pro |

---

## 🛠 Teknoloji Stack

| Katman | Teknoloji |
|---|---|
| **Frontend** | Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui |
| **Streaming UI** | Vercel AI SDK |
| **i18n** | next-intl (TR + EN, route-based: `/tr/*`, `/en/*`) |
| **Agents** | Google Genkit + Gemini 2.5 (Vertex AI backend) |
| **Validation** | Zod schemas at every agent boundary |
| **Charts** | Recharts |
| **Auth** | Supabase Auth (email/password + magic link via Resend) |
| **DB** | Supabase Postgres + RLS (multi-tenant) |
| **Real Integration** | Shopify Admin API (dev store) |
| **Mock Data** | JSON adapters (Trendyol, Hepsiburada, N11) |
| **Email** | Resend + React Email templates |
| **Testing** | Vitest (unit, TDD) + Playwright (E2E) + Genkit Evals (benchmark) |
| **Deploy** | Vercel (Next.js native) |

---

## ⚡ Hızlı Başlangıç

### Gereksinimler
- Node.js 22+
- Supabase project (free tier)
- Resend hesap (free tier)
- Gemini API key (Google AI Studio) **veya** GCP project + Vertex AI
- Shopify Partners dev store (opsiyonel — mock veriyle de çalışır)

### Kurulum

```powershell
# 1. Bağımlılıkları kur
npm install

# 2. .env.local doldur (.env.example'a bak — gereken keys'i listele)
# Supabase, Resend, GCP/Gemini, Shopify

# 3. Supabase'de migration'ları uygula
# supabase/migrations/20260514000001_initial_schema.sql
# supabase/migrations/20260514000002_rls_policies.sql

# 4. Demo veriyi yükle (Ayşe Hanım: 15 ürün, 75 yorum, 1031 satış, 5 gider)
npm run seed

# 5. Dev server
npm run dev
# http://localhost:3000 → /tr/login

# 6. (Opsiyonel) Genkit Dev UI — ajan flow'larını görsel debug et
npm run genkit:dev
```

### Login

```
E-posta: ayse@seramik.com
Şifre: AyseDemo2026!
```

---

## 🧪 Testler

```powershell
npm test              # Vitest unit tests (10 test, TDD)
npm run test:e2e      # Playwright E2E (6 test: auth, chat, cashflow, i18n)
npm run evals         # Genkit Evals — 5 ajan × 10 senaryo = 50 case benchmark
```

### Test Sonuçları (son çalıştırma)
- **Unit:** 10/10 passing
- **E2E:** 6/6 passing
- **Evals:** `{EVAL_SCORE}` (npm run evals çalıştırıldıktan sonra dashboard'da görünür)

---

## 📊 Değerlendirme Kriterleri Eşleştirmesi

| Kriter (puan) | Bu projede nasıl |
|---|---|
| **Kullanıcı Değeri (20p)** | Spesifik persona (Ayşe Hanım, gerçek KOBİ acıları), 5 ajanın her biri ayrı bir acıyı çözüyor, 600K Türkiye KOBİ pazarı |
| **Teknik Puan (20p)** | Multi-agent + peer A2A + Genkit + Supabase RLS + Shopify API + i18n + Evals + Playwright + TDD |
| **Performans & Doğruluk (10p)** | Genkit Evals 50 senaryo benchmark, Zod schema validation her ajan çıktısında |
| **Agentic Yapılar (10p)** | Hibrit C mimari: orchestrator + emergent peer A2A. Genkit Dev UI'da trace görselleştirme |
| **Yenilikçilik (10p)** | "Çok kanallı satış + 5 ajan + birbiriyle konuşma" — örnek listede yok, niş+derinlik |
| **Kullanıcı Dostu (10p)** | Tek panel, doğal dil chat, brief 10 saniyede özet, TR/EN i18n |
| **Takım Çalışması (10p)** | (Solo) — temiz commit history (58 commits), incremental development, README'de net rol |
| **Sunum & İletişim (10p)** | 8 slide deck, demo video, canlı 3-senaryo akışı |

---

## 📁 Proje Yapısı

```
Hackathon26/
├── supabase/migrations/    # SQL schema + RLS policies
├── data/                   # Mock pazaryeri JSON (Trendyol/Hepsi/N11)
├── emails/                 # React Email şablonları
├── scripts/
│   ├── seed-db.ts          # Demo veri seed
│   └── run-evals.ts        # 5 ajan benchmark
├── src/
│   ├── agents/             # 5 specialist + 1 captain + tools
│   ├── app/[locale]/       # Next.js App Router, i18n routing
│   │   ├── (auth)/         # login, signup
│   │   └── (dashboard)/    # dashboard, chat, cashflow, products, reviews, trace
│   ├── components/         # UI + agent visualization
│   ├── lib/
│   │   ├── supabase/       # @supabase/ssr clients
│   │   └── env.ts          # Zod-validated env
│   └── messages/           # tr.json, en.json
└── tests/
    ├── unit/               # Vitest (TDD)
    ├── e2e/                # Playwright
    └── evals/              # Genkit Evals datasets
```

---

## 🎯 Demo Akışı (3 senaryo, ~3 dakika)

### 1. Büyüme — "Vazo X için lansman hazırla"
SEO + Pazarlama + Fiyat ajanları paralel çalışıyor → başlık + Instagram post + fiyat önerisi tek tıkla.

### 2. Satış Çarkları + A2A — "Vazo X için fiyatı %15 düşüreyim mi?"
Fiyat ajanı **kendi başına** Nakit ve Yorum ajanlarına danışıyor → "İndirim YAPMA, paketleme kampanyası öner" çıktısı. **Agent Trace ekranında** A2A zinciri görselleşiyor.

### 3. Finans — "Nakit akışı projeksiyonu"
Senaryo toggle (mevcut / %15 indirim / kampanya) → chart kırmızıya/yeşile kayar. Nakit ajanın doğal dilde yorumu.

### Bonus: Çoklu dil
Yorumlar İngilizceyse de Yorum ajanı dil tespit + kullanıcı diline özet. UI dil toggle TR ↔ EN.

---

## 🔐 Güvenlik

- Supabase Row-Level Security (RLS) — her satıcı sadece kendi verisini görür
- Server Components + Server Actions (no client-side secrets)
- Zod schema validation her LLM çıktısında (halüsinasyon koruması)
- Service account key ortam değişkeni (asla repo'da değil)

---

## ⚠️ Production Hardening (Roadmap)

- Trendyol/Hepsiburada/N11 gerçek Marketplace API entegrasyonu (şu an mock)
- Rate limiting + cost monitoring (Gemini quota)
- Background job queue (uzun agent runs için)
- Multi-account Shopify OAuth
- Mobile app (Expo + aynı backend)

---

## 📜 Lisans

MIT — hackathon submission, open source.

---

## 🙏 Teşekkürler

Google Gemini ekibine, Genkit framework için. Supabase, Vercel, Resend ekiplerine free tier'ları için. Türkiye'de 600.000 KOBİ sahibine — bu ürün sizin için.
