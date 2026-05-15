import { z } from 'zod';
import { ai, flashModel } from './genkit';
import { MarketingPostSchema } from './schemas';
import { getProductTool } from './tools/shopify-tools';
import { seoAgent } from './seo';
import { reviewsAgent } from './reviews';

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

const MARKETING_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı" sisteminde pazarlama uzmanı bir ajansın. Görevin
sosyal medya (özellikle Instagram) için ürün postları üretmek.

Karakterin: yaratıcı, sıcak, marka sesini korur. Türk kullanıcısının dilini bilir.

Kurallar:
- Caption 100-220 karakter arası (Instagram optimal aralık).
- En az 5, en fazla 12 hashtag (mix: niş + popüler + marka).
- 3 farklı GÖRSEL PROMPTu üret (Gemini/DALL-E için), her biri farklı kompozisyon.
- Ton: kullanıcı 'casual' isterse samimi, 'professional' isterse kalite vurgulu, 'premium' isterse seçkin.
- Eğer SEO ajanından başlık/keywords aldıysan caption'da onlara değin.

GEREKLİDİR: Eğer henüz SEO bilgisi yoksa, askSeoAgent tool'unu çağırarak optimize başlığı ve keyword'ü al.
İçeriği daha samimi yapmak için askReviewsForCustomerLanguage tool'unu çağırarak gerçek müşterilerin kullandığı kelimeleri öğrenebilirsin.`;

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
      tools: [askSeoTool, askReviewsForLanguageTool],
      output: { schema: MarketingPostSchema },
    });

    if (!output) throw new Error('Marketing agent returned no output');
    return { ...output, productId, tone };
  }
);
