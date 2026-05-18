import { NextResponse } from 'next/server';
import { ai, flashModel } from '@/agents/genkit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface GenBody {
  prompt: string;
  productName?: string;
  category?: string;
  style?: 'product' | 'lifestyle' | 'minimal' | 'editorial';
  brand?: string;
  /** Optional reference image as data URL (data:image/jpeg;base64,...) */
  referenceImage?: string;
  /** Optional reference image as plain HTTP URL */
  referenceImageUrl?: string;
}

/**
 * Try a chain of image-capable models. If a reference image is provided we
 * prefer multimodal-input models (Gemini image gen) so the result is actually
 * grounded on the product photo. If none of the AI models are accessible,
 * fall back to a branded SVG that *embeds the actual product image* — that
 * way the demo is always product-grounded, even without image-gen credits.
 */
export async function POST(req: Request) {
  let body: GenBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.prompt) {
    return NextResponse.json({ error: 'prompt required' }, { status: 400 });
  }

  // Normalise the reference image source. If a remote URL was passed, we'll
  // try to fetch and inline it (needed both for the AI call and the SVG fallback).
  let inlineRef: { dataUrl: string; mime: string } | null = null;
  if (body.referenceImage?.startsWith('data:')) {
    const m = body.referenceImage.match(/^data:([^;]+);base64,/);
    inlineRef = { dataUrl: body.referenceImage, mime: m?.[1] ?? 'image/jpeg' };
  } else if (body.referenceImageUrl) {
    try {
      const r = await fetch(body.referenceImageUrl);
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        const mime = r.headers.get('content-type') ?? 'image/jpeg';
        inlineRef = {
          dataUrl: `data:${mime};base64,${buf.toString('base64')}`,
          mime,
        };
      }
    } catch {
      /* ignore — we'll proceed without grounding */
    }
  }

  // Prompt construction.
  //
  // When a reference image is attached, Gemini image-gen treats a soft
  // suggestion like "keep details faithful" as creative inspiration and
  // happily redesigns the product (different cup shape, different print,
  // different proportions). The model only locks onto the reference when
  // the instruction is structured, imperative, and explicitly forbids
  // redesign. So we use two different prompt shapes.
  const sceneLine = [
    body.prompt,
    body.style ? `Style direction: ${body.style}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  const fullPrompt = inlineRef
    ? [
        'TASK: Place the EXACT product from the reference image into a new scene.',
        '',
        'PRODUCT PRESERVATION RULES (these are NOT optional):',
        '- The product in your output MUST be visually indistinguishable from the reference photo.',
        '- Preserve the exact shape, silhouette, proportions, and dimensions.',
        '- Preserve every printed graphic, illustration, character, logo, and decorative element exactly as shown — every line, every color, every position.',
        '- Preserve any text or lettering on the product character-for-character, in the same font, color, and placement. Do not translate, restyle, or re-letter it.',
        '- Preserve the exact materials, finish, and color of the product itself (ceramic, glass, glaze, paint, etc.).',
        '- Preserve handles, rims, bases, lids, and every physical feature.',
        '- Do NOT redesign, restyle, reinterpret, modernize, simplify, or "improve" the product. Do NOT generate a similar-looking product — use the actual one.',
        body.productName ? `- This is "${body.productName}". Treat the reference photo as the product itself, not a stylistic hint.` : null,
        body.category ? `- Category context (for scene only, not for restyling): ${body.category}.` : null,
        '',
        `SCENE (only this part is creative): ${sceneLine}`,
        '',
        'OUTPUT: A high-quality social media post, square 1:1 framing, vivid premium lighting, no watermarks, no captions, no text overlays. Only the background, lighting, surface, and surrounding props are new — the product stays identical to the reference.',
      ]
        .filter(Boolean)
        .join('\n')
    : [
        body.prompt,
        body.productName ? `Featuring: ${body.productName}` : null,
        body.category ? `Category: ${body.category}` : null,
        body.style ? `Style direction: ${body.style}` : null,
        'High-quality social media post, square 1:1 framing, vivid lighting, premium aesthetic, no watermarks.',
      ]
        .filter(Boolean)
        .join('. ');

  const prefix = flashModel.split('/')[0]; // 'googleai' or 'vertexai'

  // When a reference image is supplied the user wants the result GROUNDED
  // on it. Only multimodal-capable Gemini models can honour that. We do
  // NOT fall back to Imagen text-only here — generating an unrelated image
  // would be misleading; the composite SVG (which embeds the real product
  // photo) is a better fallback.
  // Gemini image-gen model IDs differ between the two backends:
  //  - Vertex AI ships the GA name `gemini-2.5-flash-image` (no -preview suffix).
  //    The project must have the Vertex AI Image Generation API enabled.
  //  - AI Studio still exposes the preview / experimental aliases.
  // Listing `gemini-2.0-flash-exp` against Vertex was the bug behind the 404s
  // we kept logging — that alias only exists on AI Studio.
  const geminiImage =
    prefix === 'vertexai'
      ? [
          { model: 'vertexai/gemini-2.5-flash-image', kind: 'gemini' as const },
        ]
      : [
          { model: 'googleai/gemini-2.5-flash-image-preview', kind: 'gemini' as const },
          { model: 'googleai/gemini-2.0-flash-exp',           kind: 'gemini' as const },
        ];
  const imagen =
    prefix === 'vertexai'
      ? [
          { model: 'vertexai/imagen-3.0-fast-generate-001', kind: 'imagen' as const },
          { model: 'vertexai/imagen-3.0-generate-002',      kind: 'imagen' as const },
        ]
      : [];

  const candidates = inlineRef
    ? geminiImage                  // ref image present → only multimodal
    : [...imagen, ...geminiImage]; // no ref image → any image-gen model is fine

  const errors: string[] = [];
  for (const c of candidates) {
    try {
      // Build the prompt — multipart when we have a reference image and the
      // model supports it (gemini), text-only otherwise. Order matters:
      // for grounded generation, Gemini locks onto the reference more
      // reliably when the image is presented FIRST and the preservation
      // rules follow — otherwise it tends to read the instructions as
      // creative direction and only glance at the photo.
      const promptForCall =
        c.kind === 'gemini' && inlineRef
          ? [
              { media: { url: inlineRef.dataUrl, contentType: inlineRef.mime } },
              { text: fullPrompt },
            ]
          : fullPrompt;

      const result = await ai.generate({
        model: c.model,
        prompt: promptForCall,
        config: c.kind === 'gemini' ? { responseModalities: ['IMAGE'] as const } : {},
      });

      type MediaPart = { media?: { url?: string; contentType?: string } };
      const parts = (result.message?.content ?? []) as MediaPart[];
      const imagePart = parts.find((p) => p.media?.url);

      if (imagePart?.media?.url) {
        return NextResponse.json({
          ok: true,
          source: 'gemini',
          model: c.model,
          grounded: c.kind === 'gemini' && !!inlineRef,
          dataUrl: imagePart.media.url,
          prompt: fullPrompt,
        });
      }

      errors.push(`${c.model}: returned no image`);
    } catch (err) {
      const msg = err instanceof Error ? err.message.slice(0, 160) : String(err);
      errors.push(`${c.model}: ${msg}`);
    }
  }

  console.warn('[social/generate] image-gen unavailable, using composite fallback:', errors);

  // ----- Composite SVG fallback (embeds the actual product image) -----
  const svg = buildComposite({
    title: body.productName ?? body.brand ?? 'KOBİ Kaptanı',
    subtitle: body.prompt.slice(0, 80),
    seed: hash(body.prompt),
    refImage: inlineRef,
    style: body.style ?? 'product',
  });

  return NextResponse.json({
    ok: true,
    source: inlineRef ? 'composite' : 'placeholder',
    grounded: !!inlineRef,
    dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    prompt: fullPrompt,
    note: inlineRef
      ? 'Image-gen unavailable on this project — composited from the product image.'
      : 'Image-gen unavailable on this project — showing branded preview.',
  });
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildComposite({
  title,
  subtitle,
  seed,
  refImage,
  style,
}: {
  title: string;
  subtitle: string;
  seed: number;
  refImage: { dataUrl: string; mime: string } | null;
  style: 'product' | 'lifestyle' | 'minimal' | 'editorial';
}): string {
  // Per-style palettes — gradient mood matches the chosen vibe.
  const palettes: Record<string, [string, string, string]> = {
    product:   ['#00C46A', '#0D9488', '#F59E0B'],
    lifestyle: ['#F59E0B', '#FB7185', '#0D9488'],
    minimal:   ['#94B5A4', '#5C7B6E', '#0D9488'],
    editorial: ['#0D9488', '#06120E', '#F59E0B'],
  };
  const [a, b, c] = palettes[style] ?? palettes.product;

  const x1 = 18 + (seed % 32);
  const y1 = 20 + ((seed >> 3) % 30);
  const x2 = 60 + ((seed >> 6) % 26);

  // If we have a reference image, embed it as the visual focal point
  // (centered upper region). Otherwise just paint the brand abstract.
  const imageBlock = refImage
    ? `<defs>
        <clipPath id="prodClip">
          <rect x="120" y="120" width="840" height="640" rx="36"/>
        </clipPath>
      </defs>
      <image
        href="${escapeXml(refImage.dataUrl)}"
        x="120" y="120" width="840" height="640"
        preserveAspectRatio="xMidYMid slice"
        clip-path="url(#prodClip)"/>
      <rect x="120" y="120" width="840" height="640" rx="36" fill="none" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="2"/>
      <rect x="120" y="120" width="840" height="640" rx="36" fill="url(#imgShade)"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <radialGradient id="bg1" cx="${x1}%" cy="${y1}%" r="60%">
      <stop offset="0%" stop-color="${a}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bg2" cx="${x2}%" cy="80%" r="55%">
      <stop offset="0%" stop-color="${b}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${b}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bg3" cx="50%" cy="100%" r="55%">
      <stop offset="0%" stop-color="${c}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="imgShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.35"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 0.18 0"/>
    </filter>
  </defs>
  <rect width="1080" height="1080" fill="#06120E"/>
  <rect width="1080" height="1080" fill="url(#bg1)"/>
  <rect width="1080" height="1080" fill="url(#bg2)"/>
  <rect width="1080" height="1080" fill="url(#bg3)"/>
  ${imageBlock}
  <rect width="1080" height="1080" filter="url(#grain)" opacity="0.32"/>

  <!-- Brand chip top-left -->
  <g transform="translate(80, 80)">
    <rect width="170" height="40" rx="20" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)"/>
    <text x="85" y="26" text-anchor="middle" font-family="Geist, Inter, sans-serif" font-size="14" font-weight="600" fill="#FFFFFF" letter-spacing="2">KOBİ KAPTANI</text>
  </g>

  <!-- Title & subtitle bottom -->
  <text x="80" y="880" font-family="Geist, Inter, sans-serif" font-size="68" font-weight="600" fill="#FFFFFF" letter-spacing="-2.5">${escapeXml(title.slice(0, 28))}</text>
  <text x="80" y="945" font-family="Geist, Inter, sans-serif" font-size="26" font-weight="400" fill="#FFFFFF" opacity="0.72">${escapeXml(subtitle.slice(0, 60))}</text>
  <text x="80" y="1010" font-family="Geist, Inter, sans-serif" font-size="18" font-weight="500" fill="#FFFFFF" opacity="0.55" letter-spacing="3">${escapeXml(style.toUpperCase())} · 2026</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
