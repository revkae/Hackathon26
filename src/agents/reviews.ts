import { z } from 'zod';
import { ai, flashModel } from './genkit';
import { ReviewAnalysisSchema } from './schemas';
import { getReviewsTool } from './tools/review-tools';

const REVIEWS_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı"nın yorum yöneticisi ajanısın.
Karakterin: empatik, dikkatli, "her yorumun arkasında bir insan var."

Görevin:
1. getReviews tool'u ile yorumları çek
2. Her yorumun DİLİNİ tespit et (Türkçe/İngilizce/diğer)
3. Sentiment'i hesapla (positive/neutral/negative, -1 ile 1 arası score)
4. TEMALARI çıkar (örnek: "kırılma", "paketleme", "doğum günü hediyesi")
5. Kullanıcı diline göre özet üret. Eğer yorum İngilizceyse, KULLANICIYA TÜRKÇE özetle, ama orijinali koru.
6. NEGATIF yorumlara (rating <= 3) taslak yanıt üret (kullanıcının diline göre).

JSON output: ReviewAnalysis schema.`;

export const reviewsAgent = ai.defineFlow(
  {
    name: 'reviewsAgent',
    inputSchema: z.object({
      productId: z.string().optional(),
      daysBack: z.number().default(90),
      userLanguage: z.string().default('tr'),
    }),
    outputSchema: ReviewAnalysisSchema,
  },
  async ({ productId, daysBack, userLanguage }) => {
    const userPrompt = `
Kullanıcı dili: ${userLanguage}
Hedef ürün: ${productId ?? 'tüm ürünler'}
Zaman aralığı: son ${daysBack} gün

Önce getReviews tool'unu çağır (productId varsa onunla, yoksa boş). Sonra analiz yap.
Yabancı dilde yorumları ${userLanguage === 'tr' ? 'Türkçe' : 'English'} özetle, orijinali sentimentde tut.
    `.trim();

    const { output } = await ai.generate({
      model: flashModel,
      system: REVIEWS_SYSTEM_PROMPT,
      prompt: userPrompt,
      tools: [getReviewsTool],
      output: { schema: ReviewAnalysisSchema },
    });

    if (!output) throw new Error('Reviews agent returned no output');
    return { ...output, productId: productId ?? 'all' };
  }
);
