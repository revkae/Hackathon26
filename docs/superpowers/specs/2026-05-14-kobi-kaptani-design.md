# KOBİ Kaptanı — Tasarım Dokümanı

**Tarih:** 2026-05-14
**Hackathon:** Gemini AI Hackathon 2026 — Finans & E-ticaret teması
**Geliştirici:** Solo
**Süre:** 5 gün
**Durum:** Tasarım onaylandı, implementation planlamasına hazır

---

## 1. Vizyon ve Anahtar Mesaj

KOBİ Kaptanı, çok kanallı satış yapan küçük işletmecilere **5 sanal asistandan oluşan bir ekip** sunan multi-agent yapay zekâ ürünüdür. Asistanlar (SEO, Pazarlama, Fiyatlandırma, Yorum, Nakit Akışı) bir orchestrator (Kaptan Ajan) altında çalışır, **birbiriyle otomatik konuşur** ve kullanıcıya birleşik bir günlük brief + aksiyon önerisi sunar.

**Anahtar mesaj:**
> "Bir kaptan, beş asistan, sıfır endişe."

**Hedef kullanıcı:** Kendi e-ticaret sitesi (Shopify/WooCommerce) ve pazaryeri (Trendyol, Hepsiburada, N11) hesapları bulunan, büyüyen ama yalnız işletilen KOBİ.

---

## 2. Persona ve Demo Senaryosu

### Persona: Ayşe Hanım

- 38 yaşında, İstanbul'da el yapımı seramik atölyesi sahibi
- ~80 ürün (vazo, fincan, dekoratif tabak)
- Satış kanalları: Shopify (ayseseramik.com), Trendyol, Hepsiburada
- Solo işletiyor: tasarım, üretim, satış, pazarlama, muhasebe, müşteri hizmetleri

### Acı Noktaları

1. Her platforma ayrı içerik yazıyor, başlıklar tutarsız, SEO bilmiyor
2. Rakip fiyatlarını takip edemiyor, indirim mi yapsam zam mı bilmiyor
3. 50+ yorum geldi, hangisinin ne dediği belirsiz
4. Ay sonu hammadde alımı yaklaşırken kasada para var mı emin değil
5. Instagram'a düzenli içerik üretemiyor

### Demo Senaryoları (Faz Bazlı)

| Faz | Senaryo | Ajanlar |
|---|---|---|
| 1 — Büyüme | "Vazo X için lansman hazırla: başlık, post, fiyat tek tıkla." | SEO + Pazarlama + Fiyat |
| 2 — Satış Çarkları | "Yorumlardan öğrenip ürün sayfasını ve postları güncelle." | + Yorum |
| 3 — Finans | "Bu ay indirim yapabilir miyim? Ajanlar tartışıp karar veriyor." | + Nakit Akışı |

---

## 3. Hedefler ve Hedef Olmayanlar

### Hedefler (In-Scope)

- 5 ajanlı multi-agent mimari (Hibrit C: orchestrator + peer-to-peer tools)
- Genkit Dev UI ile trace görselleştirme (demo'nun yıldız özelliği)
- Shopify dev store gerçek API entegrasyonu (tek gerçek kanal)
- Trendyol/Hepsiburada/N11 için mock veri adaptörleri
- Supabase Auth + Postgres
- Resend ile branded e-posta verification
- Multilingual: TR + EN (UI ve ajan zekâsı)
- Genkit Evals ile ajan benchmark
- Playwright E2E testleri (kritik happy path'ler)
- Vercel'e deploy, paylaşılabilir prod URL
- Dashboard, chat, agent trace, cash flow chart ekranları

### Hedef Olmayanlar (Out-of-Scope)

- Ödeme / abonelik / billing
- Trendyol/Hepsiburada/N11 gerçek API entegrasyonu (mimari hazır, post-MVP)
- Mobil uygulama (web responsive yeterli)
- Çoklu dil > TR + EN
- Production-grade security audit
- Cross-browser Playwright (sadece Chromium)
- E-posta marketing entegrasyonu (sadece auth e-postaları)

---

## 4. Mimari (Hibrit C: Orchestrator + Peer-to-Peer Tools)

### 5 Katmanlı Yapı

```
┌─────────────────────────────────────────────────────────────┐
│  1) UI Katmanı — Next.js App Router + Tailwind + shadcn/ui  │
│     Dashboard, sohbet paneli, ajan trace görselleştirme     │
└────────────────────────┬────────────────────────────────────┘
                         │ Server Actions / API Routes
┌────────────────────────▼────────────────────────────────────┐
│  2) Orchestrator — "Kaptan Ajan" (Genkit flow)              │
│     Kullanıcı isteğini decompose eder, plan üretir,         │
│     uzmanları çağırır, sonuçları birleştirir.               │
└────────────────────────┬────────────────────────────────────┘
                         │ defineFlow → flow() çağrısı
┌────────────────────────▼────────────────────────────────────┐
│  3) Uzman Ajan Katmanı (5 Genkit flow)                      │
│                                                              │
│   [SEO]◄──tool──►[Yorum]   [Pazarlama]◄──tool──►[Fiyat]    │
│                                          ▲                   │
│                                          │ tool              │
│                                       [Nakit]                │
│                                                              │
│   Her uzman, alt seviyede diğer uzmanları "tool" çağırır.   │
└────────────────────────┬────────────────────────────────────┘
                         │ defineTool
┌────────────────────────▼────────────────────────────────────┐
│  4) Tool/Adapter Katmanı                                    │
│     • Shopify Admin API client (gerçek)                     │
│     • Trendyol/Hepsi/N11 mock adapters                      │
│     • Gemini multimodal (image, embed)                      │
│     • Forecast utility (moving average + Gemini commentary) │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  5) Veri Katmanı                                            │
│     • Supabase Postgres + RLS                               │
│     • Shopify dev store (canlı, az veri)                    │
│     • JSON dosyalar: 80 ürün, 200 yorum, 6 ay satış         │
└─────────────────────────────────────────────────────────────┘
```

### İki Seviyeli İletişim

**Üst seviye (deterministic):** Kaptan, isteği parçalara böler. Örnek: "Bu hafta ne yapmalıyım?" → `[seoCheck, priceCheck, cashCheck]` planı, paralel/sıralı çağırır.

**Alt seviye (emergent A2A):** Her uzman, kendi içinde mantıklı bulduğunda otomatik olarak başka uzmana sorar. Bu kararı Gemini verir, kod değil.

### Somut A2A Örneği (Demo'da Gösterilecek)

```
User: "Vazo X için fiyatı %15 düşüreyim mi?"
  └─► Kaptan → Fiyat Ajanı
        ├─ Rakip fiyatları çekti (mock pazaryeri)
        ├─ "Indirim mantıklı görünüyor AMA…"
        ├─► Fiyat → Nakit Ajanı.consultCashFlow({drop: 15})
        │     └─ "30 gün sonra kasa Y TL açık riski"
        ├─► Fiyat → Yorum Ajanı.getSentiment({product: "Vazo X"})
        │     └─ "Yorumlar zaten %88 olumlu, indirime gerek yok"
        └─ Final: "İndirim YAPMA. Alternatif: hediye paketleme kampanyası"
```

Bu trace **Genkit Dev UI'da görsel akar** — ajanların birbirini çağırma zinciri jüriye gözle gösterilir.

### Hata Yönetimi

- Her tool çağrısı Genkit'in built-in retry + Zod schema validation ile sarılı
- Bir ajan başarısız olursa Kaptan o bölümü "veri yok" işaretler, akış kırılmaz
- LLM çıktıları zod schema ile validate edilir, schema fail → 1 retry → fallback

---

## 5. 5 Ajan Spesifikasyonu

### 5.1 SEO Ajanı (Faz 1)

| Alan | Detay |
|---|---|
| Görev | Ürün başlığı, açıklama, etiketleri optimize. Aramada görünmeyen ürünleri tespit, yeni başlık önerisi |
| Giriş | Ürün ID veya "tara hepsini" komutu |
| Çıkış | Diff formatında öneri: eski başlık → yeni başlık, beklenen iyileşme açıklaması |
| Kendi tool'ları | `getProduct(id)`, `listProducts()`, Gemini text-gen, keyword density analyzer |
| Peer A2A | `Yorum.getTopKeywords(product)` → müşteri dilini kullan; `Pazarlama.getBrandVoice()` → ton tutarlılığı |
| Karakter | Detay obsesif, veriye dayalı, "her kelimenin yeri var" |
| Model | Gemini Flash |

### 5.2 Pazarlama Ajanı (Faz 1)

| Alan | Detay |
|---|---|
| Görev | Instagram caption + görsel prompt + hashtag, e-posta taslağı, paylaşım takvimi |
| Giriş | Hedef ürün/kampanya, ton (samimi/profesyonel), kanal |
| Çıkış | Caption (TR/EN), 3 alternatif görsel prompt, hashtag, optimal saat |
| Kendi tool'ları | Gemini text + multimodal (ürün görselini okuyup post fikri üretir), `getProductImages(id)` |
| Peer A2A | `SEO.getKeywords(product)` → pazarlama metni SEO uyumlu; `Yorum.getCustomerLanguage()` → müşteri sözcükleri |
| Karakter | Yaratıcı, sıcak, marka sesini korur |
| Model | Gemini Flash (multimodal için multimodal varyant) |

### 5.3 Fiyatlandırma Ajanı (Faz 1)

| Alan | Detay |
|---|---|
| Görev | Rakip fiyatlarına göre dinamik öneri, indirim/zam zamanlaması, kâr marjı koruma |
| Giriş | Ürün ID, parametre (min marj, hedef satış) |
| Çıkış | Önerilen fiyat aralığı, gerekçe, beklenen satış değişimi, risk seviyesi |
| Kendi tool'ları | `getCompetitorPrices(keyword)` (mock pazaryeri), `getMyPriceHistory(id)`, `getCostBasis(id)` |
| Peer A2A | `Nakit.simulateImpact(priceChange)` → finansal etki; `Yorum.getSentiment(id)` → yorumlar indirim gerektiriyor mu? |
| Karakter | Analitik, soğukkanlı, "sayılar yalan söylemez" |
| Model | Gemini Flash |

### 5.4 Yorum Ajanı (Faz 2)

| Alan | Detay |
|---|---|
| Görev | Yorum analizi, duygu skoru, tema çıkarma (en sevilen / en şikâyet edilen 3), taslak yanıt üretimi |
| Giriş | Ürün ID veya tüm satıcı, zaman aralığı |
| Çıkış | Duygu dağılımı grafiği, anahtar temalar, taslak cevaplar (özellikle negatif yorumlara) |
| Kendi tool'ları | `getReviews(id, daysBack)`, Gemini structured output (theme + sentiment), `generateReply()` |
| Peer A2A | Çoğunlukla bu ajan diğerleri tarafından çağrılır (veri kaynağı). Kendi başlattığı: `Pazarlama.suggestResponse(toxicReview)` kriz yönetiminde |
| Karakter | Empatik, dikkatli, "her yorumun arkasında bir insan var" |
| Model | Gemini Flash (multilingual için native destek) |
| Multilingual | Yorum dilini tespit eder, kullanıcının diline çevirir/özetler |

### 5.5 Nakit Akışı Ajanı (Faz 3)

| Alan | Detay |
|---|---|
| Görev | 30/60/90 gün nakit akışı tahmini, "ne olur eğer" simülasyonu, risk uyarısı |
| Giriş | Şu anki kasa, bekleyen ödemeler, satış geçmişi (otomatik çekilir) |
| Çıkış | Forecast grafiği (UI'da chart), risk skoru (kırmızı/sarı/yeşil), aksiyon önerisi |
| Kendi tool'ları | `getSalesHistory(days)`, `getPendingExpenses()`, `forecastCashFlow(scenario)` (moving average + Gemini commentary) |
| Peer A2A | `Pazarlama.getUpcomingCampaigns()` → kampanya geliri tahmine dâhil; nadiren `Fiyat.suggestRevenueBoost()` → açık varsa fiyat ayarı öner |
| Karakter | Muhafazakâr, "kötü ihtimali planla", mali müşavir tarzı |
| Model | Gemini Pro (forecast yorumu, complex reasoning) |

### Kaptan Ajan (Orchestrator)

| Alan | Detay |
|---|---|
| Görev | Kullanıcı isteğini decompose et, doğru uzmanlara yönlendir, paralel/sıralı çağır, sonuçları birleştir, brief üret |
| Giriş | Kullanıcı doğal dil sorgusu + context (kullanıcı dili, sezon, son aktivite) |
| Çıkış | Stream'lenmiş yapılandırılmış yanıt (markdown + structured action items) + agent trace metadata |
| Tools | 5 uzman ajan flow'u (defineFlow olarak callable) |
| Karakter | Profesyonel, lider, "ekibe nasıl en iyi sonucu aldırır?" |
| Model | Gemini Pro |

---

## 6. Teknoloji Stack

### Frontend

| Teknoloji | Niye |
|---|---|
| Next.js 15 (App Router) | TS native, Server Actions, Vercel native |
| TypeScript 5.5 | Tip güvenliği, mevcut proje |
| Tailwind CSS v4 | Hızlı UI |
| shadcn/ui | Hazır component'ler, customize edilebilir |
| Recharts | Nakit akışı grafiği (shadcn chart wrapper) |
| Vercel AI SDK (UI parts) | UI streaming (useChat tarzı) — motor Genkit, UI bu |
| next-intl | TR/EN i18n (`/tr/*`, `/en/*`) |

### Auth & Data

| Teknoloji | Niye |
|---|---|
| Supabase Postgres | Sunucusuz DB + RLS |
| Supabase Auth | Email/password + Magic link |
| `@supabase/ssr` | Next.js App Router cookie-tabanlı auth |
| Resend | Branded e-posta (React Email şablonları) |

### Agent / Backend

| Teknoloji | Niye |
|---|---|
| Genkit (Google) | Birinci taraf Gemini SDK + Dev UI + tracing + structured output |
| `@genkit-ai/googleai` | Gemini plugin |
| Zod | Schema validation (Genkit native) |
| Node.js (Next.js içinde) | Server Actions, ayrı server gerektirmez |

### Real & Mock Veri

| Kaynak | Tip |
|---|---|
| Shopify Admin API | Gerçek (dev store) |
| Trendyol/Hepsi/N11 | Mock JSON adapter |
| Seed data | 80 ürün, 200 yorum, 6 ay satış |

### Test & Benchmark

| Teknoloji | Niye |
|---|---|
| Vitest | Kritik ajan logic unit testleri |
| Playwright | E2E happy path (auth, chat, scenario toggle) |
| Genkit Evals | 50 senaryo × 5 ajan ajan doğruluk skoru |

### Deploy

| Teknoloji | Niye |
|---|---|
| Vercel | Next.js native, preview URL |
| Supabase Cloud | Free tier yeterli |
| GitHub | Vercel auto-deploy on push |

### Gemini Model Seçimi

| Kullanım | Model | Neden |
|---|---|---|
| Kaptan Ajan | Gemini Pro (en güçlü stable) | Karmaşık decompose + planlama |
| Uzman ajanlar (SEO/Fiyat/Yorum) | Gemini Flash | Hızlı, ucuz, structured output yeter |
| Pazarlama (multimodal) | Gemini Flash multimodal | Ürün görseli analiz + caption üretim |
| Nakit Akışı | Gemini Pro | Forecast commentary, nuanced reasoning |

> Spesifik model ID'leri implementation sırasında en güncel sürüme bağlanacak.

---

## 7. UI / Dashboard Yapısı

### Tasarım Felsefesi

- Dark mode default, ışıklı opsiyonel
- shadcn estetiği: yuvarlatılmış kartlar, ince border, geniş whitespace
- Renk: nötr siyah/gri + emerald accent (#10b981)
- Tipografi: Inter (body) + JetBrains Mono (trace/kod)
- Layout: sol sidebar nav, üst bar, ana içerik

### 5 Ana Ekran

#### 1. Dashboard ("Bugün")
İlk izlenim ekranı. Üst kısımda Kaptan'ın günün brief'i (son 24 saat 5 ajanın özeti). Altta 4 stat kartı: bugün sipariş, bekleyen yorum, açık aksiyon, nakit pozisyon. En altta son ajan aktivite zaman çizelgesi (canlı feed).

#### 2. Kaptan Sohbet (Chat)
Ana etkileşim ekranı. Sol panel: okunabilir Kaptan yanıtları (markdown + action card'lar). Sağ panel: canlı agent trace stream (hangi ajan ne çağırdı). Alt: input + suggestion chips.

#### 3. Agent Trace (Yıldız Ekran)
Swimlane Gantt görselleştirmesi. Her ajan bir lane, çağrılar lane'ler arası ok. Genkit'in built-in trace'inden otomatik üretilir. Tıkla detay aç. **Demonun teknik bombası.**

#### 4. Nakit Akışı
Recharts area chart, 90 günlük forecast. Senaryo toggle (mevcut / %15 indirim / yeni kampanya) chart'ı günceller. Altta Nakit ajanın natural language yorumu + peer çağrı butonu.

#### 5. Auth (Login/Signup)
Minimal split-screen: form + brand visual. Email/password + magic link. Resend e-posta şablonu açılır.

### Component Inventory

| Component | Kullanım | shadcn? |
|---|---|---|
| `<Sidebar>` | Sol nav | Custom + shadcn `Sheet` |
| `<DashboardCard>` | Stat kartları | shadcn `Card` |
| `<BriefCard>` | Günün özeti | shadcn `Card` + `Badge` |
| `<ChatPanel>` | Kaptan sohbet | AI SDK `useChat` + `ScrollArea` |
| `<AgentTimeline>` | Trace swimlane | Custom (Genkit trace JSON → SVG/Canvas) |
| `<CashFlowChart>` | Nakit grafiği | shadcn `Chart` (Recharts) + Scenario toggle |
| `<ProductCard>` | Ürün listesi | shadcn `Card` |
| `<ReviewItem>` | Yorum + sentiment | shadcn `Card` + `Badge` |
| `<LanguageToggle>` | TR/EN | shadcn `DropdownMenu` |
| `<AgentChip>` | Hangi ajan konuştu | shadcn `Badge` (renkli) |

---

## 8. Veri Modeli (Supabase Postgres)

```sql
-- Auth tarafı Supabase Auth tarafından yönetilir (auth.users)

create table profiles (
  id uuid primary key references auth.users(id),
  business_name text not null,
  preferred_language text default 'tr',
  shopify_store_url text,
  shopify_access_token text, -- MVP: env var via Vercel; post-MVP: pgsodium symmetric encryption
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  external_id text, -- Shopify product ID
  name text not null,
  description text,
  current_price numeric(10,2),
  cost_basis numeric(10,2),
  category text,
  images jsonb default '[]'::jsonb,
  channels jsonb default '[]'::jsonb, -- ['shopify','trendyol','hepsiburada']
  created_at timestamptz default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  channel text not null, -- 'shopify','trendyol',...
  language text, -- 'tr','en',... (auto-detected)
  rating int check (rating between 1 and 5),
  body text not null,
  sentiment_score numeric(3,2), -- -1 to 1
  themes jsonb default '[]'::jsonb,
  reply_draft text,
  posted_at timestamptz,
  created_at timestamptz default now()
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id),
  channel text not null,
  quantity int not null,
  unit_price numeric(10,2) not null,
  total_revenue numeric(10,2) not null,
  occurred_at timestamptz not null
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  category text, -- 'hammadde','kira','vergi',...
  due_at timestamptz not null,
  paid boolean default false
);

create table agent_traces (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  query text not null,
  trace_json jsonb not null, -- Genkit trace export
  duration_ms int,
  total_tokens int,
  cost_estimate numeric(10,4),
  created_at timestamptz default now()
);

-- RLS: kullanıcı sadece kendi profile_id'sine ait satırları görür
alter table profiles enable row level security;
alter table products enable row level security;
-- ... her tabloda
create policy "own data" on products
  for all using (profile_id = auth.uid());
-- ... tüm tablolarda benzer
```

---

## 9. Multilingual Destek

### UI Tarafı
- `next-intl` v3+ (App Router uyumlu)
- Route segmentleri: `/tr/dashboard`, `/en/dashboard`
- JSON dosyaları: `src/i18n/tr.json`, `src/i18n/en.json`
- LanguageToggle component (sağ üst dropdown)
- Default: tarayıcı `Accept-Language` → fallback `tr`

### Ajan Tarafı
- Kaptan: kullanıcı hangi dilde yazarsa o dilde yanıtlar (Gemini native)
- Yorum ajanı: yorumun dilini Gemini ile tespit, kullanıcı diline çevirip özetler
- Pazarlama ajanı: hedef pazara göre dilde içerik üretir (global ürün → EN caption)
- SEO ajanı: kullanıcı dilinde başlık önerir, gerekirse alternatif dilde de

### Veri Tarafı
- `reviews.language` kolonu (yorumun orijinal dili)
- `profiles.preferred_language` kullanıcı tercihi
- Çevirilmiş içerikler cache'lenmez (Gemini hızlı), demo akışında inline

---

## 10. Test ve Benchmark Stratejisi

### Vitest (Unit)
- Kritik tool'lar: forecast utility (moving average doğru hesaplıyor mu?)
- Zod schema'lar: ajan çıktısı schema'ya uyuyor mu?
- Mock adapter: trendyol.json → uniform CompetitorPrice tipine map ediyor mu?
- ~15-20 test, focused

### Playwright (E2E)
- Happy path 1: Signup → magic link → dashboard görünür
- Happy path 2: Chat'e mesaj at → stream gel → action card render
- Happy path 3: Nakit chart'ta senaryo toggle → grafik güncellenir
- Happy path 4: Dil toggle TR→EN → tüm UI string'leri değişir
- Chromium only, headed mode for demo

### Genkit Evals (Benchmark)
- 50 senaryo: 10 × 5 ajan
- Her senaryo: input + expected output (ground truth) + grading rubric
- SEO: ground truth optimize başlık (manuel hazırlanmış)
- Pazarlama: rubric tabanlı (LLM-as-judge, 5 kriter)
- Fiyat: numeric tolerance (önerilen fiyat ground truth aralığında mı?)
- Yorum: sentiment classification accuracy + theme overlap
- Nakit: forecast MAPE (mean absolute percentage error) < %15
- Sonuç: results.json + Dashboard'da "Evals Skoru" widget

---

## 11. 5 Günlük Faz Planı

### Gün 1: Setup + Faz 1 Çekirdek

**Sabah (4h):** Supabase project + Auth + schema. Resend hesap + DNS + 2 React Email şablonu. Next.js 15 + Tailwind + shadcn + next-intl init. Genkit + Gemini API key + hello-world flow. Shopify Partners dev store + Admin API token. Seed data import (80 ürün, 200 yorum, 6 ay satış). GitHub repo init + Vercel project link (henüz fonksiyonel deploy yok, sadece projeyi bağla).

**Öğleden Sonra (4h):** Layout (sidebar + topbar). Auth sayfaları (login/signup/verify). middleware.ts auth gate. Dashboard skeleton. Kaptan ajan v0 (intent decompose). SEO ajan v0 (getProduct + Gemini + return). Pipe: chat → Kaptan → SEO → response. Smoke test.

**DoD:** Login → dashboard → "Vazo X başlığını optimize et" → cevap döner.
**Risk:** Resend DNS verification 1-4 saat sürebilir → sabah ilk iş başlat.

### Gün 2: Faz 1 Tamamlama

**Sabah:** Pazarlama ajan (caption + 3 görsel prompt + hashtag). Fiyat ajan (mock competitor + price suggestion). Mock data adapter (trendyol.json, hepsi.json, n11.json). Tool tanımları (Zod schemas). İlk peer A2A: Pazarlama → SEO.

**Öğleden Sonra:** ChatPanel UI (streaming, AI SDK useChat). ProductCard component. AgentChip (renkli badge). Brief card gerçek veriyle. Dark mode cilası. Manuel demo: büyüme senaryosu.

**DoD:** Büyüme demo akışı çalışıyor (başlık + post + fiyat tek tıkla).

### Gün 3: Faz 2 + İlk Deploy + Playwright

**Sabah:** Yorum ajan (getReviews, sentiment, theme extract). Multilingual (Gemini ile dil tespit + çeviri). Peer A2A genişlet (SEO→Yorum, Pazarlama→Yorum). ReviewItem component + sentiment pie chart.

**Öğleden Sonra:** İlk Vercel deploy + env config. Deploy bug fix (RSC/edge runtime). Playwright config + 2 happy path. Resend domain verify kontrol.

**DoD:** Production URL stabil, satış çarkları demosu prod'da, 2 E2E test yeşil.

### Gün 4: Faz 3 + Trace Görselleştirme

**Sabah:** Nakit ajan (salesHistory, expenses, forecast moving avg). Peer A2A (Fiyat→Nakit, Nakit→Pazarlama). Forecast + Gemini natural commentary. Manuel demo: finans senaryosu.

**Öğleden Sonra:** CashFlowChart (Recharts area). Scenario toggle. AgentTimeline component (Genkit trace → SVG swimlane) — en zor görev, plan B: text timeline. i18n full pass. Loading skeletons + error toasts.

**DoD:** Finans demo çalışıyor, agent trace ekranı ilk versiyonu var, i18n çalışıyor.

### Gün 5: Evals + Cila + Sunum

**Sabah:** Genkit Evals 50 senaryo (10 × 5 ajan). Eval runner çalıştır, results.json. Dashboard'da Evals Skoru widget. Playwright kalan paths. Son UI cila.

**Öğleden Sonra:** Demo video kaydı (3 senaryo, ~3 dk). Sunum slidelar (8 slide). Demo provası ×5. README + submission paketi.

**DoD:** Demo video çekildi, slidelar bitti, prod URL stabil, evals raporu var, submission gönderildi.

---

## 12. Risk Kaydı

| Risk | Etki | Olasılık | Önlem |
|---|---|---|---|
| Auth + Resend DNS gecikmesi | 0.5 gün kayıp | Orta | Gün 1 sabah ilk iş, async ilerle |
| Genkit + Vercel edge runtime uyumsuzluğu | Deploy bozulur | Orta | Node runtime'a düşür, dokümante et |
| AgentTimeline SVG render karmaşası | 0.5 gün kayıp | Yüksek | Plan B: text-based timeline |
| Demo videosunda bug görünmesi | Sunum güveni kırılır | Düşük | 2x prova, bug-free senaryo akışı |
| Gemini API rate limit | Demo'da freeze | Düşük | Rate limit handle + cached fallback |
| Genkit Evals API immature | Benchmark çalışmaz | Düşük | Manuel benchmark script ile fallback |

### Buffer / Cuttable List (Sıkışırsak Sırasıyla Kes)

1. Mobile responsive cilası (desktop demo yeterli)
2. Playwright cross-browser (sadece Chromium)
3. Agent trace SVG → text timeline'a düş
4. i18n'de EN yarım kalsın, TR tam
5. Evals 50 senaryo → 25 senaryo
6. (Son çare) Faz 3 nakit ajan basitleşir, scenario simulation kesilir

---

## 13. Jüri Sunum Hikâyesi

### Sunum Süresi
- 6-7 dakika sunum + 2-3 dakika Q&A
- 8 slide, her biri 30-60 saniye, demo slide'ı 3-4 dakika

### Slide Sırası

| # | Başlık | Mesaj | Süre |
|---|---|---|---|
| 1 | "Ayşe Hanım'ın Bir Salı Günü" | 5 sekmeli ekran görüntüsü, empati anı | 40s |
| 2 | Problem | "80 ürün, 3 kanal, 1 kişi. Türkiye'de 600K KOBİ aynı" | 30s |
| 3 | "Bir kaptan, beş asistan" | Mimari basitleştirilmiş diyagram | 40s |
| 4 | **CANLI DEMO** | 3 senaryo akışı | 3-4 dk |
| 5 | "Ajanlar Birbiriyle Konuşuyor" | Agent Trace ekranı, A2A açıklama | 45s |
| 6 | "Ölçtük, çalışıyor" | Genkit Evals tablosu | 30s |
| 7 | Roadmap + Vizyon | Trendyol API, mobile, SaaS pazarı | 30s |
| 8 | Teşekkür + QR | Prod URL, GitHub, LinkedIn | 15s |

### Canlı Demo Akışı (Slide 4)

**Setup:** Prod URL açık (login yapılmış). İkinci sekmede Genkit Dev UI. Üçüncüde Gmail (Resend email). Browser zoom %125.

**Akış 1 — Büyüme (90s):**
1. Dashboard aç, brief'i ve 4 stat'ı göster
2. Chat'e yaz: "Vazo X için lansman hazırla"
3. Stream akarken sağda trace'i işaret et
4. Çıktıları göster: başlık + caption + 3 görsel prompt + fiyat

**Akış 2 — A2A (60s):**
1. Chat'e yaz: "Vazo X için fiyatı %15 düşüreyim mi?"
2. Trace'i işaretle: "Fiyat ajanı kendi başına Yorum'a ve Nakit'e soruyor — bu Gemini'nin agentic kararı, kod değil."
3. Final cevabı oku: "İndirim YAPMA. Alternatif: paketleme kampanyası."
4. Agent Trace sekmesini aç → swimlane göster.

**Akış 3 — Finans (60s):**
1. Nakit Akışı sekmesi → forecast chart
2. Senaryo toggle: %15 indirim → chart kırmızıya
3. Nakit ajanın yorumunu oku
4. Dil toggle TR → EN, 2 saniye göster.

### Anahtar Cümleler

**Açılış:** "Ayşe Hanım her sabah 5 sekme açıyor. Hepsi onun. Hepsi farklı dilde konuşuyor. Bugün size bir kaptan ve beş asistan sunacağım."

**A2A vurgusu:** "Fiyat ajanı, biz söylemeden, kendi mantığıyla Nakit ajanına soruyor. Bu Gemini'nin agentic kararı, kod değil. Bu, jüri kriterinizdeki 'agentic yapılar' tanımının somut hali."

**Evals geçişi:** "Bir hackathon ürünü 'çalışıyor mu?' diye sorulur. Biz ölçtük — Genkit Evals ile 50 senaryo, ortalama doğruluk skoru `{EVAL_SCORE}`." (skor Gün 5 sabah eval run'dan sonra slide'a yazılacak)

**Kapanış:** "600 bin Türk KOBİ'si var. Hepsi Ayşe Hanım. KOBİ Kaptanı, onların yanına bir ekip koyar. Teşekkürler."

### Q&A Hazırlığı

| Soru | Cevap |
|---|---|
| Trendyol API entegrasyonu? | "Marketplace API satıcı kaydı gerektirir. Ayşe Hanım kendi credential'ı ile yetkilendirir, adapter pattern'le bağlarız. Şu an mock, mimari prod-ready." |
| Gemini halüsinasyonu? | "İki katmanlı koruma: (1) Zod schema validation, (2) Genkit Evals'la ground truth ölçümü." |
| Diğer LLM'lerle çalışır mı? | "Genkit + ajan pattern model-agnostic. Gemini'yi native multimodal ve uzun context için seçtik." |
| Maliyet? | "Günlük ~0.05$, aylık ~1.5$. SaaS'ta 99 TL/ay rahat." |
| Veri güvenliği? | "Supabase Postgres + RLS, her satıcı kendi verisini görür. Auth Supabase. E-postalar Resend." |
| Niye 5 ajan, tek shot değil? | "Single shot LLM = global optimum yok. Specialized ajanlar her domain'inde derin, A2A ile context paylaşır. Evals'ta single-shot baseline ile karşılaştırdık (`{BASELINE_DELTA}` farkla daha doğru)." (baseline karşılaştırması Gün 5'te eval setine eklenecek) |

---

## 14. Submission Checklist (Gün 5 Akşam)

- [ ] Production URL erişilebilir, login çalışıyor
- [ ] GitHub repo public, README'de kurulum + demo link
- [ ] Demo video YouTube'a yüklenmiş, public (~3 dakika)
- [ ] Sunum slidelar PDF olarak export
- [ ] Evals raporu (results.json + dashboard ekran kaydı)
- [ ] LinkedIn/Twitter post taslağı
- [ ] Demo ortamında senaryo verisi taze (eski tarihli görünmesin)
- [ ] Auth flow son kez test edildi
- [ ] Resend e-postaları temiz görünüyor
- [ ] Mock veri tutarlı (fiyatlar, isimler, tarihler)

---

## 15. Değerlendirme Kriterleri Eşleştirmesi

| Kriter | Puan | Bu Tasarım Nasıl Kazanır |
|---|---|---|
| Kullanıcı Değeri | 20 | Spesifik persona (Ayşe Hanım) + 5 somut acı noktası → her ajan bir acıyı çözer. Pazar 600K KOBİ. |
| Teknik Puan | 20 | Multi-agent + peer A2A + Genkit + Supabase + Shopify API + i18n + Evals + Playwright. Mimari kararlar gerekçeli. |
| Performans ve Doğruluk | 10 | Genkit Evals 50 senaryo skoru, dashboard widget'ı, jüriye somut sayı sunar. Zod schema validation. |
| Agentic Yapılar | 10 | Hibrit C mimarisi: orchestrator + peer A2A. Trace görselleştirmesi A2A'yı somutlaştırır. |
| Yenilikçilik ve Özgünlük | 10 | "Birden çok kanal + çoklu ajan + birbiriyle konuşma" kombinasyonu örnek listede yok. KOBİ niş + persona güçlü. |
| Kullanıcı Dostu Çalışma | 10 | Tek panelden tüm kanallar. Doğal dil chat. Brief kartı 10 saniyede anlaşılır. i18n. |
| Takım Çalışması | 10 | (Solo) — README'de net rol açıklaması, commit geçmişi temiz, sunumda "solo trade-off'ları" açıklanır |
| Sunum ve İletişim | 10 | 8 slide, somut sayılar, canlı demo, A2A vurgusu, anahtar cümleler ezberli |

**Toplam hedef:** 90+ / 100
