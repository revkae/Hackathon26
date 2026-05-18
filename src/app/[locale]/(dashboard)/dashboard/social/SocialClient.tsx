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

const PROMPT_PRESETS: Array<{ tr: string; en: string }> = [
  { tr: 'Bayram indirimi — sıcak tonlar, doğal ışık', en: 'Holiday sale — warm tones, natural light' },
  { tr: 'Yeni ürün lansmanı — premium, sade arka plan', en: 'New product launch — premium, clean backdrop' },
  { tr: 'İlkbahar koleksiyonu — pastel, dış mekan', en: 'Spring collection — pastel, outdoor' },
  { tr: 'Hediye paketi — sıcak ev atmosferi', en: 'Gift box — cozy home atmosphere' },
];

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
  const [productId, setProductId] = useState<string | null>(products[0]?.id ?? null);
  const [style, setStyle] = useState<Style>('product');
  const [prompt, setPrompt] = useState(isTr ? PROMPT_PRESETS[1].tr : PROMPT_PRESETS[1].en);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refSource, setRefSource] = useState<RefImageSource>({ kind: 'none' });
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

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
      notifications.show({
        color: 'green',
        title: `${platform} ✓`,
        message: isTr
          ? `Paylaşıldı (demo). Gerçek API entegrasyonu Captain plan'da gelir.`
          : `Posted (demo). Real API integration ships in the Captain plan.`,
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
    const caption = generateCaption(product?.name ?? '', style, prompt, isTr);
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
              {PROMPT_PRESETS.map((p) => (
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
                  {generateCaption(product?.name ?? '', style, prompt, isTr)}
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

function generateCaption(productName: string, style: Style, prompt: string, isTr: boolean): string {
  const product = productName || (isTr ? 'Yeni koleksiyon' : 'New collection');
  if (isTr) {
    const styleHook = {
      product: 'El emeği. Detay detay.',
      lifestyle: 'Evde, bir köşede, hep yakında.',
      minimal: 'Yalın. Ama tam.',
      editorial: 'Hikâyesi olan parçalar.',
    }[style];
    return `✨ ${product} — ${styleHook}\n\n${prompt}\n\n#elemegi #seramik #tasarım #yeniürün #atölye`;
  }
  const styleHook = {
    product: 'Handcrafted. Detail by detail.',
    lifestyle: 'In a corner of your home, always close.',
    minimal: 'Simple. Yet complete.',
    editorial: 'Pieces with a story.',
  }[style];
  return `✨ ${product} — ${styleHook}\n\n${prompt}\n\n#handmade #ceramic #design #newdrop #studio`;
}
