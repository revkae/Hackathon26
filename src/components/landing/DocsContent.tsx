interface DocsSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

interface DocsContentProps {
  locale: string;
}

export function DocsContent({ locale }: DocsContentProps) {
  const isTr = locale === 'tr';
  const sections: DocsSection[] = isTr ? trSections() : enSections();
  const groups = isTr
    ? [
        { heading: 'Başlangıç', ids: ['giris', 'kurulum', 'ilk-sorgu'] },
        { heading: 'Mürettebat', ids: ['ajanlar', 'a2a', 'kaptan'] },
        { heading: 'Referans', ids: ['api', 'webhook', 'sss'] },
      ]
    : [
        { heading: 'Getting started', ids: ['giris', 'kurulum', 'ilk-sorgu'] },
        { heading: 'The crew', ids: ['ajanlar', 'a2a', 'kaptan'] },
        { heading: 'Reference', ids: ['api', 'webhook', 'sss'] },
      ];

  const byId = Object.fromEntries(sections.map((s) => [s.id, s]));

  return (
    <div className="docs-layout">
      <aside className="docs-sidebar">
        {groups.map((g) => (
          <div key={g.heading}>
            <h4>{g.heading}</h4>
            {g.ids.map((id) => (
              <a key={id} href={`#${id}`}>{byId[id]?.title}</a>
            ))}
          </div>
        ))}
      </aside>

      <article className="docs-content">
        <h1>
          {isTr ? (
            <>KOBİ Kaptanı <em>Dokümanlar</em></>
          ) : (
            <>KOBİ Kaptanı <em>Docs</em></>
          )}
        </h1>
        <p style={{ fontSize: 16.5, marginTop: 10 }}>
          {isTr
            ? 'Beş uzman ajanın çalışma şekli, Kaptan orkestrasyonu ve sistemi nasıl entegre edeceğiniz.'
            : 'How the five specialist agents work, how the Captain orchestrates them, and how to integrate the system.'}
        </p>

        {sections.map((s) => (
          <section key={s.id} id={s.id} style={{ scrollMarginTop: 96 }}>
            <h2>{s.title}</h2>
            {s.body}
          </section>
        ))}
      </article>
    </div>
  );
}

function trSections(): DocsSection[] {
  return [
    {
      id: 'giris',
      title: 'Giriş',
      body: (
        <>
          <p>
            <strong>KOBİ Kaptanı</strong>, çok kanallı satış yapan küçük ve orta ölçekli işletmeler için tasarlanmış bir AI ekibidir. Beş uzman ajan ve onları orkestralayanın bir Kaptan, işin bütün yönlerini (SEO, pazarlama, fiyatlama, müşteri yorumları, nakit akışı) sizin yerinize takip eder.
          </p>
          <div className="docs-callout">
            <strong>Kısaca:</strong> Form doldurmazsın, menü açmazsın — Kaptan&apos;a doğal dilde ne istediğini yazarsın, o doğru uzmanları çağırır, sana tek panelden net aksiyonlar verir.
          </div>
        </>
      ),
    },
    {
      id: 'kurulum',
      title: 'Kurulum',
      body: (
        <>
          <p>İlk kurulum 60 saniyeden kısa sürer. Kredi kartı gerekmez.</p>
          <ol>
            <li><a href={`/tr/signup`}>Kayıt ol</a> — sadece e-posta ve şirket adı.</li>
            <li>Shopify, Trendyol veya Etsy mağazanı bağla (OAuth, tek tık).</li>
            <li>Kaptan ürünlerini ve son siparişlerini indirir — yaklaşık 30 saniye.</li>
            <li>Hazır. İlk sorgunu yaz.</li>
          </ol>
        </>
      ),
    },
    {
      id: 'ilk-sorgu',
      title: 'İlk sorgun',
      body: (
        <>
          <p>Kaptan&apos;ı denemenin en hızlı yolu, somut bir görev vermektir. Birkaç örnek:</p>
          <pre><code>{`> "Vazo X için Instagram lansman planı çıkar"
> "Son 7 günde olumsuz yorum alan ürünleri listele"
> "Geçen aydan kalan stok için %15 indirim kampanyası öner"
> "Önümüzdeki 60 günlük nakit akışını göster"`}</code></pre>
          <p>
            Kaptan ne yapacağını anlar, doğru uzmanları çağırır ve sonuçları birleştirip sana getirir. <code>Enter</code> ile gönder, <kbd>Shift</kbd>+<kbd>Enter</kbd> ile yeni satır.
          </p>
        </>
      ),
    },
    {
      id: 'ajanlar',
      title: 'Beş uzman ajan',
      body: (
        <>
          <h3>SEO Ajanı</h3>
          <p>Ürün başlıklarını ve açıklamalarını arama motoru için optimize eder. Anahtar kelime önerir, mevcut metni yeniden yazar, A/B varyantları üretir.</p>
          <h3>Pazarlama Ajanı</h3>
          <p>Instagram açıklamaları, görsel fikirleri, hashtag setleri ve kampanya takvimi. Markanın tonunu öğrenir, sonraki çıktılar da o tonda olur.</p>
          <h3>Fiyat Ajanı</h3>
          <p>Trendyol, Hepsiburada, Etsy gibi pazaryerlerinde rakip fiyatlarını günde bir kez tarar. Marjını koruyan fiyat aralığını önerir; sen onaylarsan otomatik günceller.</p>
          <h3>Yorum Ajanı</h3>
          <p>Tüm kanallardaki müşteri yorumlarını çekip dil-bağımsız analiz eder. Negatif eğilimleri erkenden yakalar, marka sesinle yanıt taslakları hazırlar.</p>
          <h3>Nakit Akışı Ajanı</h3>
          <p>30/60/90 günlük nakit projeksiyonu yapar. &ldquo;Bu ürünü %20 indirirsem nakit nasıl etkilenir?&rdquo; gibi senaryoları canlı simüle eder.</p>
        </>
      ),
    },
    {
      id: 'a2a',
      title: 'Agent-to-Agent (A2A)',
      body: (
        <>
          <p>
            Uzmanlar gerektiğinde birbirine danışır. Örnek: SEO Ajanı yeni bir başlık yazarken Fiyat Ajanı&apos;ndan o ürünün rakipler arasındaki konumunu sorar — &ldquo;premium&rdquo; tonla mı yoksa &ldquo;uygun fiyat&rdquo; tonla mı yazılacağına ona göre karar verir.
          </p>
          <p>
            Bu konuşmaları Kaptan görür, gerektiğinde durdurur, sana özetler. <a href={`/tr/dashboard/trace`}>Trace</a> ekranından her A2A çağrısını adım adım inceleyebilirsin.
          </p>
        </>
      ),
    },
    {
      id: 'kaptan',
      title: 'Kaptan',
      body: (
        <>
          <p>
            Kaptan, uzmanları yöneten orkestrasyon katmanıdır. Senin yazdığın natural dil isteği alır, hangi uzmanların gerekli olduğunu anlar, sıralamayı kurar, sonuçları birleştirir.
          </p>
          <p>
            Karmaşık görevlerde Kaptan birden fazla ajanı paralel çalıştırır. &ldquo;Vazo X için lansman&rdquo; isteğinde aynı anda SEO + Pazarlama + Fiyat ajanlarını başlatır, sonra çıktıları sentezler. Toplam süre genelde 8-15 saniye.
          </p>
        </>
      ),
    },
    {
      id: 'api',
      title: 'API (Kaptan plan)',
      body: (
        <>
          <p>Kaptan planında REST API erişimin var. Tipik bir çağrı:</p>
          <pre><code>{`POST https://api.kobikaptani.com/v1/ask
Authorization: Bearer sk_live_...
Content-Type: application/json

{
  "query": "Vazo X için lansman hazırla",
  "context": {
    "store_id": "tr_trendyol_42",
    "product_sku": "VAZE-X-001"
  }
}`}</code></pre>
          <p>
            Yanıt streaming olarak gelir — uzmanlar konuştukça parça parça düşer. SSE veya WebSocket seçebilirsin.
          </p>
        </>
      ),
    },
    {
      id: 'webhook',
      title: 'Webhook\'lar',
      body: (
        <>
          <p>Önemli olaylarda sistemine bildirim göndeririz:</p>
          <ul>
            <li><code>review.negative_trend</code> — bir ürün 24 saatte 3+ olumsuz yorum aldıysa.</li>
            <li><code>price.competitor_undercut</code> — rakip senin fiyatının %5+ altına indi.</li>
            <li><code>cashflow.warning</code> — 30 gün içinde nakit eşiği altında.</li>
          </ul>
          <p>
            Webhook URL&apos;sini <a href={`/tr/dashboard`}>Ayarlar</a>&apos;dan ekleyebilirsin. HMAC imzalı, çoklu deneme destekli.
          </p>
        </>
      ),
    },
    {
      id: 'sss',
      title: 'Sıkça sorulanlar',
      body: (
        <>
          <h3>Hangi pazaryerleri destekleniyor?</h3>
          <p>Şu an Shopify, Trendyol, Hepsiburada, Etsy ve Amazon TR. WooCommerce ve PrestaShop hackathon sonrası ekleniyor.</p>
          <h3>Verilerim eğitim için kullanılıyor mu?</h3>
          <p>Hayır. Tüm sorgular zero-data-retention modda çalıştırılır (Vercel AI Gateway üzerinden). Sadece sen görürsün.</p>
          <h3>Türkçe&apos;den başka dil?</h3>
          <p>Şu an TR ve EN. Almanca ve Arapça yol haritasında.</p>
        </>
      ),
    },
  ];
}

function enSections(): DocsSection[] {
  return [
    {
      id: 'giris',
      title: 'Introduction',
      body: (
        <>
          <p>
            <strong>KOBİ Kaptanı</strong> is an AI team for multi-channel small and mid-sized businesses. Five specialist agents and a Captain that orchestrates them watch every side of your business — SEO, marketing, pricing, customer reviews, cash flow — so you don&apos;t have to.
          </p>
          <div className="docs-callout">
            <strong>TL;DR:</strong> No forms, no menus. Tell the Captain in plain language what you want — it pulls the right specialists, returns a unified answer in one panel.
          </div>
        </>
      ),
    },
    {
      id: 'kurulum',
      title: 'Setup',
      body: (
        <>
          <p>First setup takes under 60 seconds. No credit card required.</p>
          <ol>
            <li><a href={`/en/signup`}>Sign up</a> — just email + business name.</li>
            <li>Connect your Shopify, Trendyol, or Etsy store (one-click OAuth).</li>
            <li>The Captain ingests your products and recent orders — about 30 seconds.</li>
            <li>You&apos;re ready. Write your first query.</li>
          </ol>
        </>
      ),
    },
    {
      id: 'ilk-sorgu',
      title: 'Your first query',
      body: (
        <>
          <p>The fastest way to try the Captain is to give it a concrete task. A few examples:</p>
          <pre><code>{`> "Prepare an Instagram launch plan for Vase X"
> "List products that got negative reviews in the last 7 days"
> "Suggest a 15% off campaign for leftover stock"
> "Show me cash flow for the next 60 days"`}</code></pre>
          <p>
            The Captain figures out what to do, calls the right specialists, and merges the results. Press <code>Enter</code> to send, <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line.
          </p>
        </>
      ),
    },
    {
      id: 'ajanlar',
      title: 'The five specialists',
      body: (
        <>
          <h3>SEO Agent</h3>
          <p>Optimizes product titles and descriptions for search. Suggests keywords, rewrites existing copy, generates A/B variants.</p>
          <h3>Marketing Agent</h3>
          <p>Instagram captions, image ideas, hashtag sets, and campaign calendars. Learns your brand voice, sticks to it.</p>
          <h3>Pricing Agent</h3>
          <p>Scans competitor prices on Trendyol, Hepsiburada, Etsy, etc. daily. Suggests a price range that protects your margin; on your approval it auto-updates.</p>
          <h3>Reviews Agent</h3>
          <p>Pulls customer reviews from every channel, analyzes them language-agnostically. Catches negative trends early, drafts replies in your voice.</p>
          <h3>Cash Flow Agent</h3>
          <p>Projects cash 30/60/90 days ahead. Simulates scenarios live — &ldquo;what if I discount this product 20%?&rdquo;</p>
        </>
      ),
    },
    {
      id: 'a2a',
      title: 'Agent-to-Agent (A2A)',
      body: (
        <>
          <p>
            Specialists consult each other when needed. Example: the SEO Agent, when writing a new title, asks the Pricing Agent about the product&apos;s position vs competitors — and decides whether to use a &ldquo;premium&rdquo; or &ldquo;affordable&rdquo; tone accordingly.
          </p>
          <p>
            The Captain sees these conversations, can interrupt them, and summarizes them for you. Inspect every A2A call step by step from the <a href={`/en/dashboard/trace`}>Trace</a> screen.
          </p>
        </>
      ),
    },
    {
      id: 'kaptan',
      title: 'The Captain',
      body: (
        <>
          <p>
            The Captain is the orchestration layer that runs the specialists. It takes your natural-language request, figures out which specialists are needed, sequences them, and merges the results.
          </p>
          <p>
            For complex tasks the Captain runs multiple agents in parallel. A &ldquo;launch for Vase X&rdquo; request triggers SEO + Marketing + Pricing simultaneously, then synthesizes the outputs. End-to-end usually 8–15 seconds.
          </p>
        </>
      ),
    },
    {
      id: 'api',
      title: 'API (Captain plan)',
      body: (
        <>
          <p>The Captain plan ships with REST API access. A typical call:</p>
          <pre><code>{`POST https://api.kobikaptani.com/v1/ask
Authorization: Bearer sk_live_...
Content-Type: application/json

{
  "query": "Prepare a launch for Vase X",
  "context": {
    "store_id": "tr_trendyol_42",
    "product_sku": "VAZE-X-001"
  }
}`}</code></pre>
          <p>
            The response streams — specialists drip in as they finish. Pick SSE or WebSocket.
          </p>
        </>
      ),
    },
    {
      id: 'webhook',
      title: 'Webhooks',
      body: (
        <>
          <p>We notify your system on important events:</p>
          <ul>
            <li><code>review.negative_trend</code> — a product picked up 3+ negative reviews in 24h.</li>
            <li><code>price.competitor_undercut</code> — a competitor dropped 5%+ below your price.</li>
            <li><code>cashflow.warning</code> — cash projected below threshold within 30 days.</li>
          </ul>
          <p>
            Add your webhook URL in <a href={`/en/dashboard`}>Settings</a>. HMAC-signed, automatic retries.
          </p>
        </>
      ),
    },
    {
      id: 'sss',
      title: 'FAQ',
      body: (
        <>
          <h3>Which marketplaces are supported?</h3>
          <p>Today: Shopify, Trendyol, Hepsiburada, Etsy, Amazon TR. WooCommerce and PrestaShop ship post-hackathon.</p>
          <h3>Is my data used for training?</h3>
          <p>No. Every query runs in zero-data-retention mode (via Vercel AI Gateway). Only you see it.</p>
          <h3>Languages beyond Turkish?</h3>
          <p>Today TR and EN. German and Arabic on the roadmap.</p>
        </>
      ),
    },
  ];
}
