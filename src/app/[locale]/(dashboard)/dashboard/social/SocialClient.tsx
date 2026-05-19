'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { notifications } from '@mantine/notifications';
import {
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandFacebook,
  IconDownload,
  IconSparkles,
  IconWand,
  IconCopy,
  IconCheck,
  IconPhoto,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import { useConnections } from '@/lib/connections';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number | null;
  imageUrl: string | null;
}

type Style = 'product' | 'lifestyle' | 'minimal' | 'editorial';

const STYLES: Array<{ id: Style; label: { tr: string; en: string } }> = [
  { id: 'product',   label: { tr: 'Ürün',      en: 'Product' } },
  { id: 'lifestyle', label: { tr: 'Lifestyle', en: 'Lifestyle' } },
  { id: 'minimal',   label: { tr: 'Minimal',   en: 'Minimal' } },
  { id: 'editorial', label: { tr: 'Editöryel', en: 'Editorial' } },
];

type Suggestion = { tr: string; en: string };

// Generic fallback chips — used only when there are no products in the catalog.
const PROMPT_PRESETS: Suggestion[] = [
  { tr: 'Bayram indirimi — sıcak tonlar, doğal ışık', en: 'Holiday sale — warm tones, natural light' },
  { tr: 'Yeni ürün lansmanı — premium, sade arka plan', en: 'New product launch — premium, clean backdrop' },
  { tr: 'İlkbahar koleksiyonu — pastel, dış mekan', en: 'Spring collection — pastel, outdoor' },
  { tr: 'Hediye paketi — sıcak ev atmosferi', en: 'Gift box — cozy home atmosphere' },
];

// Scene templates anchored to a real product (or its category). Each one is
// combined with a styling DETAIL below to form a full scene/prompt suggestion.
const SCENES: Array<{
  tr: (p: { name: string; category: string }) => string;
  en: (p: { name: string; category: string }) => string;
}> = [
  { tr: (p) => `${p.name} lansmanı`,          en: (p) => `${p.name} launch` },
  { tr: (p) => `${p.name} — bayram indirimi`, en: (p) => `${p.name} — holiday sale` },
  { tr: (p) => `${p.name} hediye paketi`,     en: (p) => `${p.name} as a gift` },
  { tr: (p) => `${p.name} yakın çekim`,       en: (p) => `${p.name} close-up` },
  { tr: (p) => `Yeni: ${p.name}`,             en: (p) => `New arrival: ${p.name}` },
  { tr: (p) => `${p.name} flatlay`,           en: (p) => `${p.name} flatlay` },
  { tr: (p) => `Çok satan: ${p.name}`,        en: (p) => `Bestseller: ${p.name}` },
  {
    tr: (p) => (p.category ? `${p.category} koleksiyonu` : `${p.name} koleksiyonu`),
    en: (p) => (p.category ? `${p.category} collection` : `${p.name} collection`),
  },
];

// Styling half of a suggestion — the bit after the em dash.
const DETAILS: Suggestion[] = [
  { tr: 'sıcak tonlar, doğal ışık',      en: 'warm tones, natural light' },
  { tr: 'premium, sade arka plan',       en: 'premium, clean backdrop' },
  { tr: 'pastel, dış mekan',             en: 'pastel, outdoor' },
  { tr: 'sıcak ev atmosferi',            en: 'cozy home atmosphere' },
  { tr: 'minimal stüdyo, yumuşak gölge', en: 'minimal studio, soft shadow' },
  { tr: 'editöryel, tekstür detayı',     en: 'editorial, texture detail' },
  { tr: 'üstten çekim, doğal zemin',     en: 'top-down, natural surface' },
];

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Keep chip text short so suggestions don't overflow their row.
function trimName(value: string): string {
  const v = value.trim();
  return v.length > 26 ? `${v.slice(0, 25).trimEnd()}…` : v;
}

// Builds a fresh, product-anchored set of scene prompts. Runs on the client
// each time the Social page mounts, so the chips differ on every visit.
function buildPromptSuggestions(products: Product[], count: number): Suggestion[] {
  if (products.length === 0) return shuffle(PROMPT_PRESETS).slice(0, count);

  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (let attempt = 0; out.length < count && attempt < 80; attempt++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const scene = SCENES[Math.floor(Math.random() * SCENES.length)];
    const detail = DETAILS[Math.floor(Math.random() * DETAILS.length)];
    const p = { name: trimName(product.name), category: trimName(product.category) };
    const en = `${scene.en(p)} — ${detail.en}`;
    if (seen.has(en)) continue;
    seen.add(en);
    out.push({ tr: `${scene.tr(p)} — ${detail.tr}`, en });
  }
  // Tiny catalog that couldn't fill the row → pad with generic presets.
  for (const preset of shuffle(PROMPT_PRESETS)) {
    if (out.length >= count) break;
    if (!seen.has(preset.en)) {
      seen.add(preset.en);
      out.push(preset);
    }
  }
  return out;
}

interface GenerationResult {
  dataUrl: string;
  source: 'gemini' | 'placeholder' | 'composite';
  prompt: string;
  grounded?: boolean;
  note?: string;
}

type RefImageSource =
  | { kind: 'none' }
  | { kind: 'product'; url: string }
  | { kind: 'upload'; dataUrl: string; name: string };

export function SocialClient({ locale, products }: { locale: string; products: Product[] }) {
  const isTr = locale === 'tr';
  const { socials } = useConnections();
  const igHandle = socials.instagram?.handle;
  const [productId, setProductId] = useState<string | null>(products[0]?.id ?? null);
  const [style, setStyle] = useState<Style>('product');
  const [prompt, setPrompt] = useState(isTr ? PROMPT_PRESETS[1].tr : PROMPT_PRESETS[1].en);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refSource, setRefSource] = useState<RefImageSource>({ kind: 'none' });
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Prompt-suggestion chips: rebuilt from the live catalog on every mount, so
  // they always reference real products and differ each time you open the page.
  const [presets, setPresets] = useState<Suggestion[]>(PROMPT_PRESETS);

  const product = products.find((p) => p.id === productId);

  // When the product changes, default the reference image to that product's photo
  // (if any). User can override via upload or clear it.
  useEffect(() => {
    if (product?.imageUrl) {
      setRefSource({ kind: 'product', url: product.imageUrl });
    } else if (refSource.kind === 'product') {
      setRefSource({ kind: 'none' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Randomise the suggestion chips once per page visit.
  useEffect(() => {
    setPresets(buildPromptSuggestions(products, 4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = () => {
    if (!prompt.trim()) return;
    startTransition(async () => {
      try {
        const refPayload =
          refSource.kind === 'upload'
            ? { referenceImage: refSource.dataUrl }
            : refSource.kind === 'product'
            ? { referenceImageUrl: refSource.url }
            : {};

        const res = await fetch('/api/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt.trim(),
            productName: product?.name,
            category: product?.category,
            style,
            brand: 'KOBİ Kaptanı',
            ...refPayload,
          }),
        });
        const data = await res.json();
        if (data.ok && data.dataUrl) {
          setResult({
            dataUrl: data.dataUrl,
            source: data.source,
            prompt: data.prompt,
            grounded: data.grounded,
            note: data.note,
          });
        } else {
          notifications.show({ color: 'red', message: data.error ?? 'Generation failed' });
        }
      } catch {
        notifications.show({ color: 'red', message: isTr ? 'Bağlantı hatası' : 'Network error' });
      }
    });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      notifications.show({
        color: 'red',
        message: isTr ? 'Dosya 4MB üzerinde — küçült' : 'File over 4MB — please resize',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRefSource({ kind: 'upload', dataUrl: reader.result, name: file.name });
      }
    };
    reader.readAsDataURL(file);
  };

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

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = `${product?.name ?? 'kobi-kaptani'}-${Date.now()}.${result.source === 'gemini' ? 'png' : 'svg'}`;
    a.click();
  };

  const copyCaption = async () => {
    if (!result) return;
    const caption = generateCaption(product, style, isTr);
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const refPreviewUrl =
    refSource.kind === 'upload' ? refSource.dataUrl
    : refSource.kind === 'product' ? refSource.url
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1180 }}>
      {/* Header */}
      <div>
        <span className="section-eyebrow">{isTr ? 'Sosyal Medya' : 'Social Media'}</span>
        <h1
          className="landing-sans-display"
          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: 0 }}
        >
          {isTr ? 'Bir saniyede' : 'A post-worthy'}{' '}
          <em
            className="landing-display"
            style={{
              fontStyle: 'italic',
              fontWeight: 400,
              background: 'linear-gradient(115deg, var(--c-emerald) 0%, var(--c-amber) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {isTr ? 'paylaşıma değer.' : 'image, in a second.'}
          </em>
        </h1>
        <p style={{ marginTop: 12, color: 'var(--fg-mute)', fontSize: 15, lineHeight: 1.55, maxWidth: 600 }}>
          {isTr
            ? 'Ürün seç, fotoğrafını referans göster, stilini söyle — Kaptan görseli ürününle uyumlu şekilde üretir.'
            : 'Pick a product, ground with its photo, describe the vibe — the Captain generates an on-brand image.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: 28 }} className="social-grid">
        {/* LEFT: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Product picker */}
          <div>
            <label className="social-label">{isTr ? 'Ürün' : 'Product'}</label>
            {products.length === 0 ? (
              <div className="social-empty-note">
                {isTr
                  ? 'Henüz ürün yok. Mağazanı bağlayınca buradan seçebilirsin.'
                  : 'No products yet. Connect your store to pick from your catalog.'}
              </div>
            ) : (
              <div className="social-product-grid">
                {products.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductId(p.id)}
                    className={`social-product-card${p.id === productId ? ' is-selected' : ''}`}
                  >
                    <span className="social-product-name">{p.name}</span>
                    {p.price !== null && (
                      <span className="social-product-price">₺{p.price.toFixed(0)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reference image */}
          <div>
            <label className="social-label">
              {isTr ? 'Görsel Referansı' : 'Reference Image'}
              {refSource.kind !== 'none' && (
                <span style={{ marginLeft: 8, fontSize: 10.5, color: 'var(--c-emerald)', letterSpacing: '0.06em' }}>
                  · {isTr ? 'GROUNDED' : 'GROUNDED'}
                </span>
              )}
            </label>

            <div className="social-ref-row">
              {refPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={refPreviewUrl} alt="reference" className="social-ref-thumb" />
              ) : (
                <div className="social-ref-thumb social-ref-empty">
                  <IconPhoto size={22} stroke={1.6} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontSize: 13, color: 'var(--fg)' }}>
                  {refSource.kind === 'product'
                    ? `${isTr ? 'Ürün fotoğrafı' : 'Product photo'} — ${product?.name}`
                    : refSource.kind === 'upload'
                    ? refSource.name
                    : isTr
                    ? 'Referans görsel yok'
                    : 'No reference image'}
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="social-mini-btn"
                    onClick={() => fileRef.current?.click()}
                  >
                    <IconUpload size={11} stroke={2.4} />
                    {isTr ? 'Yükle' : 'Upload'}
                  </button>
                  {product?.imageUrl && refSource.kind !== 'product' && (
                    <button
                      type="button"
                      className="social-mini-btn"
                      onClick={() => setRefSource({ kind: 'product', url: product.imageUrl! })}
                    >
                      <IconPhoto size={11} stroke={2.2} />
                      {isTr ? 'Ürün fotoğrafını kullan' : 'Use product photo'}
                    </button>
                  )}
                  {refSource.kind !== 'none' && (
                    <button
                      type="button"
                      className="social-mini-btn"
                      onClick={() => setRefSource({ kind: 'none' })}
                      style={{ color: 'var(--c-rose)' }}
                    >
                      <IconX size={11} stroke={2.4} />
                      {isTr ? 'Kaldır' : 'Clear'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleUpload}
            />
          </div>

          {/* Style picker */}
          <div>
            <label className="social-label">{isTr ? 'Stil' : 'Style'}</label>
            <div className="social-style-row">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`social-style-chip${style === s.id ? ' is-selected' : ''}`}
                >
                  {isTr ? s.label.tr : s.label.en}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="social-label">{isTr ? 'Senaryo / İstem' : 'Scene / Prompt'}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="auth-input"
              style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }}
              placeholder={isTr ? 'Örn. Yaz aylarına özel, doğal ışık, sıcak tonlar' : 'e.g. Summer vibe, natural light, warm tones'}
            />
            <div className="social-presets">
              {presets.map((p) => (
                <button
                  key={p.tr}
                  type="button"
                  className="chat-suggestion"
                  style={{ fontSize: 12.5, padding: '6px 10px' }}
                  onClick={() => setPrompt(isTr ? p.tr : p.en)}
                >
                  <IconWand size={11} stroke={2.2} style={{ color: 'var(--c-amber)' }} />
                  <span>{isTr ? p.tr : p.en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            type="button"
            onClick={generate}
            disabled={pending || !prompt.trim()}
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '14px 22px', fontSize: 15 }}
          >
            <IconSparkles size={16} stroke={2.4} />
            {pending
              ? isTr ? 'Kaptan üretiyor…' : 'The Captain is generating…'
              : isTr ? 'Görseli Üret' : 'Generate Image'}
          </button>
        </div>

        {/* RIGHT: Preview + share */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="social-preview-card">
            <div className="social-preview-frame">
              {result ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.dataUrl} alt="Generated" className="social-preview-img" />
              ) : pending ? (
                <SocialPreviewLoading isTr={isTr} />
              ) : (
                <SocialPreviewEmpty isTr={isTr} />
              )}
            </div>

            {result && (
              <div className="social-source-tag">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background:
                      result.source === 'gemini'    ? 'var(--c-emerald)' :
                      result.source === 'composite' ? 'var(--c-amber)'   :
                                                      'var(--fg-mute)',
                  }}
                />
                {result.source === 'gemini'
                  ? isTr
                    ? `Gemini ile ${result.grounded ? 'grounded ' : ''}üretildi`
                    : `Generated with Gemini${result.grounded ? ' (grounded)' : ''}`
                  : result.source === 'composite'
                  ? isTr
                    ? 'Composite — gerçek ürün fotoğrafından kompoze edildi'
                    : 'Composite — built from your real product photo'
                  : isTr
                  ? 'Demo görseli — image-gen modelleri bu projede aktif değil'
                  : 'Demo image — image-gen models not enabled on this project'}
              </div>
            )}
          </div>

          {result && (
            <>
              <div className="social-caption-card">
                <div className="social-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{isTr ? 'Hazır başlık' : 'Ready caption'}</span>
                  <button
                    type="button"
                    onClick={copyCaption}
                    className="social-mini-btn"
                  >
                    {copied ? <IconCheck size={12} stroke={2.4} /> : <IconCopy size={12} stroke={2.2} />}
                    {copied ? (isTr ? 'Kopyalandı' : 'Copied') : (isTr ? 'Kopyala' : 'Copy')}
                  </button>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--fg)', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {generateCaption(product, style, isTr)}
                </p>
              </div>

              <div className="social-share-row">
                <button type="button" className="social-share-btn social-share-ig" disabled={posting} onClick={() => fakePost('Instagram')}>
                  <IconBrandInstagram size={15} stroke={2} />
                  Instagram
                </button>
                <button type="button" className="social-share-btn social-share-tw" disabled={posting} onClick={() => fakePost('Twitter / X')}>
                  <IconBrandTwitter size={15} stroke={2} />
                  Twitter / X
                </button>
                <button type="button" className="social-share-btn social-share-fb" disabled={posting} onClick={() => fakePost('Facebook')}>
                  <IconBrandFacebook size={15} stroke={2} />
                  Facebook
                </button>
                <button type="button" className="btn-ghost btn-small" onClick={download}>
                  <IconDownload size={13} stroke={2.4} />
                  {isTr ? 'İndir' : 'Download'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialPreviewEmpty({ isTr }: { isTr: boolean }) {
  return (
    <div className="social-preview-empty">
      <IconSparkles size={26} stroke={1.6} style={{ color: 'var(--c-emerald)' }} />
      <p>{isTr ? 'Görseli üret, burada görünsün.' : 'Hit generate, preview shows here.'}</p>
    </div>
  );
}

function SocialPreviewLoading({ isTr }: { isTr: boolean }) {
  return (
    <div className="social-preview-empty">
      <div className="thinking-dots" style={{ marginBottom: 12 }}>
        <span /><span /><span />
      </div>
      <p>{isTr ? 'Kaptan görseli üretiyor…' : 'The Captain is generating…'}</p>
    </div>
  );
}

// Builds a product-focused caption from the selected product, never echoing
// the raw scene/prompt (that's an image-gen instruction, not caption copy).
function generateCaption(product: Product | undefined, style: Style, isTr: boolean): string {
  const name = product?.name?.trim() || (isTr ? 'Yeni koleksiyon' : 'New collection');
  const category = product?.category?.trim() ?? '';

  if (isTr) {
    const headline = {
      product: 'El emeği, detay detay.',
      lifestyle: 'Evde, tam da senin köşende.',
      minimal: 'Yalın. Ama tam.',
      editorial: 'Hikâyesi olan bir parça.',
    }[style];
    const body = {
      product: `Her ${name}, atölyemizde tek tek elde üretiliyor.`,
      lifestyle: `${name}, günlük hayatının bir parçası olmak için tasarlandı.`,
      minimal: `${name}: gereksiz hiçbir şey yok, gereken her şey var.`,
      editorial: `${name} — sade çizgileriyle kendi hikâyesini anlatıyor.`,
    }[style];
    return `✨ ${name} — ${headline}\n\n${body}\n\n${buildTags(category, true)}`;
  }

  const headline = {
    product: 'Handcrafted, detail by detail.',
    lifestyle: 'Made for your everyday corner.',
    minimal: 'Simple. Yet complete.',
    editorial: 'A piece with a story.',
  }[style];
  const body = {
    product: `Every ${name} is made by hand, one at a time, in our studio.`,
    lifestyle: `The ${name} is designed to belong in your everyday life.`,
    minimal: `The ${name}: nothing unnecessary, everything that matters.`,
    editorial: `The ${name} — clean lines telling their own story.`,
  }[style];
  return `✨ ${name} — ${headline}\n\n${body}\n\n${buildTags(category, false)}`;
}

// A category-aware hashtag line so the tags track the chosen product.
function buildTags(category: string, isTr: boolean): string {
  const base = isTr
    ? ['#elemegi', '#seramik', '#tasarım', '#atölye']
    : ['#handmade', '#ceramic', '#design', '#studio'];
  const slug = category
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü ]/gi, '')
    .trim()
    .replace(/\s+/g, '');
  return [...new Set(slug ? [`#${slug}`, ...base] : base)].join(' ');
}
