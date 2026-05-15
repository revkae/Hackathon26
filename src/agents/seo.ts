import { z } from 'zod';
import { ai, flashModel } from './genkit';
import { SeoSuggestionSchema } from './schemas';
import { getProductTool, listProductsTool } from './tools/shopify-tools';
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

const SEO_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı" sisteminde SEO uzmanı bir ajansın. Görevin küçük işletmelerin
ürün başlık ve açıklamalarını arama motorları + pazaryeri algoritmaları için optimize etmek.

Karakterin: detay odaklı, veri-driven, Google'ın gözüyle bakar. Her kelimenin yeri vardır.

Kurallar:
- Başlıklar 60-70 karakteri geçmemeli (Google snippet limiti).
- Türkçe ürünler için Türkçe başlık, İngilizce ürünler için İngilizce.
- 2-3 ana keyword içersin (örn: "el yapımı" + "vazo" + "hediye").
- Marka/kategoriden çok ihtiyacı/kullanım amacını vurgula ("doğum günü hediyesi vazo" gibi).
- Gereksiz tıklama tuzakları yok ("EN İYİ", "MUTLAKA AL" yok).

Çıktın STRICT olarak SeoSuggestion JSON schemasına uymalı.
Eğer ürün hakkında müşteri yorumlarını bilmek istersen askReviewsForKeywords tool'unu çağır — gerçek müşteri sözcükleriyle başlık daha güçlü olur.`;

export const seoAgent = ai.defineFlow(
  {
    name: 'seoAgent',
    inputSchema: z.object({
      productId: z.string(),
      additionalContext: z.string().optional(),
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
      tools: [askReviewsForKeywordsTool],
      output: { schema: SeoSuggestionSchema },
    });

    if (!output) throw new Error('SEO agent returned no output');
    return {
      ...output,
      productId,
      oldTitle: product.name,
    };
  }
);
