# ⚓ KOBİ Kaptanı — *Captain*

> **Beş asistan, bir kaptan, sıfır endişe.**

Çok kanallı satış yapan küçük işletmelerin arka ofisini yöneten **çok ajanlı yapay
zekâ uygulaması**. Tek bir orkestratör ajan — **Kaptan** — beş uzman ajanı yönetir;
ajanlar gerektiğinde birbirleriyle de konuşur (Agent-to-Agent / A2A) ve size tek
panelden birleşik, uygulanabilir bir günlük brief sunar.

**Gemini AI Hackathon 2026 — Finans & E-ticaret teması için inşa edildi.**

<!-- Gerçek ekran görüntüsü veya tanıtım GIF'i ile değiştirin -->
<img width="2506" height="1304" alt="image" src="https://github.com/user-attachments/assets/6eba4adb-1e75-4d47-87c9-e9195b43309f" />

---

## 🎯 Bu uygulama ne işe yarar?

Küçük e-ticaret satıcıları her şapkayı aynı anda takar: tasarım, üretim, SEO,
fiyatlandırma, müşteri hizmetleri, muhasebe, sosyal medya. **KOBİ Kaptanı** onlara
bir ekip verir.

Doğal dille tek bir soru sorarsınız; **Kaptan** isteği parçalara böler, doğru uzman
ajanları görevlendirir, gerektiğinde onların *birbirine danışmasına* izin verir ve
size tek bir net cevap döndürür.

### Mürettebat

| Ajan | Görevi |
|---|---|
| ⚓ **Kaptan** | Orkestratör. İsteğinizi anlar, planı kurar, doğru uzmanlara dağıtır, sonuçları tek brief'te birleştirir. |
| 🔍 **SEO Ajanı** | Ürün başlıklarını, açıklamalarını ve etiketlerini aramada üst sıralar için optimize eder. |
| 📢 **Pazarlama Ajanı** | Instagram açıklaması, görsel fikirleri ve hazır hashtag setleri üretir. |
| 💰 **Fiyat Ajanı** | Rakip pazaryeri fiyatlarını izler, kâr marjınızı koruyan fiyatı önerir. |
| 💬 **Yorum Ajanı** | Müşteri yorumlarını analiz eder, tema ve duygu çıkarır, yanıt taslakları yazar — her dilde. |
| 📊 **Nakit Akışı Ajanı** | 30/60/90 günlük nakit projeksiyonu yapar, "ne olur eğer" senaryolarını canlı simüle eder. |

Öne çıkan özellik **ajanlar arası (A2A) iş birliği**: Fiyat Ajanı, siz söylemeden,
kendi mantığıyla Nakit Akışı Ajanı'na finansal etkiyi ve Yorum Ajanı'na duygu
skorunu sorabilir. Bu çağrıların hepsi **Agent Trace** ekranında görselleşir.

---

## ✨ Özellikler

- 🤖 **Hibrit çok ajanlı mimari** — orkestratör + peer-to-peer uzman tool'ları
- 🧵 **Canlı agent trace** — hangi ajan hangisini, ne zaman çağırdı? Swimlane görünümü
- 🛒 **Gerçek Shopify entegrasyonu** — mağaza bağlayın, canlı ürün/sipariş/nakit verisi görün
- 🎭 **Mock / Gerçek veri modu** — örnek demo verisiyle keşfedin ya da canlı veriye geçin
- 💬 **Doğal dil sohbeti** — form yok, menü yok; sadece Kaptan'a sorun
- 🌍 **Çift dilli (TR / EN)** — hem arayüz hem ajan zekâsı
- 📊 **Nakit akışı tahmini** — canlı senaryo toggle'lı Recharts grafiği
- 📧 **Markalı auth e-postaları** — Supabase Auth + Resend + React Email şablonları
- ✅ **Test edilmiş** — Vitest birim testleri, Playwright E2E ve ajan benchmark'ı

---

## 📸 Ekran Görüntüleri

> 📷 **Bunlar yer tutucudur.** Kendi görsellerinizi aynı dosya adlarıyla
> `docs/screenshots/` klasörüne koyun; otomatik olarak burada görünürler.

| Panel ("Bugün") | Kaptan Sohbet |
|---|---|
| <img width="2506" height="1303" alt="image" src="https://github.com/user-attachments/assets/4565308d-97e5-4686-b568-c772264907d3" /> | <img width="2504" height="1305" alt="image" src="https://github.com/user-attachments/assets/874882fc-e2aa-48ac-af93-805e2fdf4e02" /> |

| Agent Trace | Nakit Akışı |
|---|---|
| <img width="2502" height="1304" alt="image" src="https://github.com/user-attachments/assets/fa0957c6-925c-48b6-b00d-de990cd772d5" /> | <img width="2505" height="1305" alt="image" src="https://github.com/user-attachments/assets/357ee6d8-ca86-46e5-9327-96d466b170c6" /> |

| Ürünler | Ayarlar & Bağlantılar |
|---|---|
| <img width="2507" height="1306" alt="image" src="https://github.com/user-attachments/assets/fa23304f-c863-4205-90ff-63101853097d" /> | <img width="2505" height="1305" alt="image" src="https://github.com/user-attachments/assets/4451d8bd-21e0-4d0c-a028-c9215aa38234" /> |

---

## 🛠 Teknoloji Stack

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions) · React 19 · TypeScript 5.5 |
| Arayüz | Mantine 8 · Tailwind CSS v4 · Recharts · Tabler Icons |
| Ajanlar | Genkit · Google Gemini (Vertex AI / AI Studio) · Vercel AI SDK · Zod |
| Veri & Auth | Supabase (Postgres + RLS) · `@supabase/ssr` |
| E-posta | Resend · React Email |
| i18n | next-intl (`/tr/*`, `/en/*`) |
| Test | Vitest · Playwright |
| Deploy | Vercel |

---

## ⚡ Hızlı Başlangıç

### Gereksinimler

- **Node.js 22+** ve npm
- Bir **Supabase** projesi (ücretsiz katman yeterli)
- Bir **Google Gemini** API anahtarı (AI Studio) — veya Vertex AI için bir GCP projesi
- Bir **Resend** hesabı (auth e-postaları için)
- *(Opsiyonel)* Gerçek modu denemek için bir **Shopify** dev store + Admin API token

### 1. Kurulum

```bash
git clone https://github.com/revkae/Hackathon26.git
cd Hackathon26
npm install
```

### 2. Ortam değişkenlerini yapılandırın

Proje kök dizininde bir `.env.local` dosyası oluşturun:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://projeniz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-anahtariniz
SUPABASE_SERVICE_ROLE_KEY=service-role-anahtariniz

# E-posta (Resend)
RESEND_API_KEY=re_api_anahtariniz
RESEND_FROM_EMAIL=merhaba@alanadiniz.com

# Gemini — ya AI Studio…
GEMINI_API_KEY=gemini-api-anahtariniz
# …ya da Vertex AI (yukarıdaki GEMINI_API_KEY'i boş bırakın)
# GCP_PROJECT_ID=gcp-projeniz
# GCP_LOCATION=us-central1
# GCP_SERVICE_ACCOUNT_JSON={...}   # Vercel deploy'da zorunlu

# Shopify — opsiyonel, sadece Gerçek mod için gerekli
# SHOPIFY_STORE_DOMAIN=magazaniz.myshopify.com
# SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...

# Uygulama
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Veritabanını hazırlayın

`supabase/migrations/` altındaki SQL dosyalarını **sırayla**, Supabase Dashboard →
**SQL Editor** üzerinden uygulayın:

1. `20260514000001_initial_schema.sql`
2. `20260514000002_rls_policies.sql`
3. `20260519000001_app_mode_and_chat.sql`
4. `20260519000002_store_connections.sql`

> ℹ️ Migration'lar elle uygulanır — bu repo Supabase CLI'ya bağlı değildir.

### 4. Demo veriyi yükleyin

Demo personası için ~80 ürün, 200 yorum ve 6 aylık satış verisi yükler:

```bash
npm run seed
```

### 5. Uygulamayı çalıştırın

```bash
npm run dev
```

**http://localhost:3000** adresini açın — `/tr` veya `/en` adresine yönlendirilirsiniz.

Ajan flow'larını görsel olarak debug etmek için Genkit Dev UI'ı ayrıca çalıştırın:

```bash
npm run genkit:dev
```

---

## 🚀 Nasıl kullanılır?

1. **Kaydolun** — açılış sayfasından kayıt olun, markalı Resend e-postasıyla doğrulayın.
2. **Panel ("Bugün")** — Kaptan'ın günlük brief'i + stat kartları: bugünkü siparişler,
   bekleyen yorumlar, açık aksiyonlar, nakit pozisyonu.
3. **Sohbet** — Kaptan'a doğal dille her şeyi sorun, örneğin:
   - *"Vazo X için Instagram lansmanı hazırla"*
   - *"Vazo X için fiyatı %15 düşüreyim mi?"*
   - *"60 günlük nakit akışı projeksiyonu göster"*
   Yanıtlar solda akar; canlı agent trace sağda akar.
4. **Agent Trace** — her ajan çağrısının swimlane görünümü; Kaptan'ın hiç emretmediği
   ajanlar-arası çağrılar dâhil.
5. **Ürünler / Yorumlar / Nakit Akışı / Sosyal** — her alan için ayrı ekranlar;
   Nakit Akışı'nda senaryo toggle'ları.
6. **Ayarlar** — mağazalarınızı bağlayın ve **Mock** ↔ **Gerçek** veri modu arasında geçin:
   - **Mock mod** (varsayılan) — tüm ekranlar örnek demo verisini gösterir. Harici
     hesap olmadan ürünü keşfetmek için idealdir.
   - **Gerçek mod** — bir Shopify mağazası bağlayın; Ürünler, Nakit Akışı ve Bugün
     ekranları **canlı veri** çeker. Bir istek başarısız olursa uygulama örnek veriye
     geri döner ve bir uyarı şeridi gösterir; böylece canlı ve demo verisi karışmaz.

---

## 📁 Proje Yapısı

```
src/
  agents/        # Kaptan + 5 uzman ajan, tool'lar, şemalar, Genkit kurulumu
  app/[locale]/  # Next.js App Router — açılış, auth, dashboard route'ları
  components/    # Arayüz bileşenleri (kartlar, grafikler, sohbet paneli, trace…)
  lib/           # Supabase client'ları, Shopify katmanı, app-mode, bağlantılar, i18n
supabase/
  migrations/    # SQL şema, RLS politikaları (elle uygulanır)
scripts/
  seed-db.ts     # demo veri yükleyici
  run-evals.ts   # ajan benchmark runner'ı
tests/           # Vitest birim testleri + Playwright E2E
docs/            # tasarım dokümanı, implementation planları, ekran görüntüleri
```

---

## 📜 Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusunu başlatır (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production build'i çalıştırır |
| `npm run lint` | Projeyi lint eder |
| `npm run test` | Birim testleri (Vitest) |
| `npm run test:e2e` | Uçtan uca testler (Playwright) |
| `npm run genkit:dev` | Genkit geliştirici arayüzünü açar |
| `npm run seed` | Veritabanını demo veriyle doldurur |
| `npm run evals` | Ajan doğruluk benchmark'ını çalıştırır |

---

## ☁️ Deploy

Uygulama **Vercel**'e sıfır yapılandırmayla deploy edilir. `.env.local` içindeki tüm
değişkenleri Vercel projesinin ortam değişkenlerine ekleyin — Vertex AI kullanıyorsanız
**`GCP_SERVICE_ACCOUNT_JSON` production'da zorunludur**.

---

## 📄 Lisans

Gemini AI Hackathon 2026 için inşa edildi. © 2026 KOBİ Kaptanı.
