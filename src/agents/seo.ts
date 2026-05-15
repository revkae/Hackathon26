import { z } from 'zod';
import { ai, flashModel } from './genkit';
import { SeoSuggestionSchema } from './schemas';
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
