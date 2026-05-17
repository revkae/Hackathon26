import { z } from 'zod';
import { ai, proModel } from './genkit';
import { CashFlowForecastSchema } from './schemas';
import { computeCashFlowBase } from './tools/cashflow-compute';

const CASHFLOW_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı"nın mali müşaviri ajansın.
Karakterin: muhafazakâr, "kötü ihtimali planla", risk uyarıcı.

Görevin:
1. getSalesHistory ile son N gün satışları çek
2. getPendingExpenses ile yaklaşan ödemeleri çek
3. Gelir/gider günlük ortalamalarını hesapla (sana sayılarla verilecek)
4. Senaryoya göre forecast hesabı YAPILACAK kodla, sen YORUMUNU yaz
5. Risk skoru: green (rahat), yellow (dikkat), red (kritik)
6. Aksiyon öner: gider erteleme, fiyat ayarı, kampanya zamanlaması

Önemli: hesaplamayı SEN yapmıyorsun, sadece YORUMLUYORSUN. Kod sana projeksiyon verisini hazırlayıp gönderecek.`;

export const cashFlowAgent = ai.defineFlow(
  {
    name: 'cashFlowAgent',
    inputSchema: z.object({
      scenario: z.enum(['current', 'discount15', 'campaign']).default('current'),
      days: z.number().default(90),
      userLanguage: z.string().default('tr'),
    }),
    outputSchema: CashFlowForecastSchema,
  },
  async ({ scenario, days, userLanguage }) => {
    // 1. Deterministic projection (no LLM) — shared with the fast SSR path.
    const base = await computeCashFlowBase({ scenario, days });

    // 2. Ask Gemini for commentary only.
    const commentaryPrompt = `
Senaryo: ${scenario}
Mevcut bakiye: ${base.currentBalance.toFixed(0)} TL
Günlük ortalama gelir: ${base.adjustedRevenue.toFixed(0)} TL
Günlük ortalama gider: ${base.dailyAvgExpense.toFixed(0)} TL
${days} gün sonra projekte bakiye: ${base.projectedEnd.toFixed(0)} TL
Minimum bakiye dönemi: ${base.minBalance.toFixed(0)} TL
Risk skoru: ${base.riskScore}

${userLanguage === 'tr' ? 'TÜRKÇE' : 'ENGLISH'} olarak 2-3 cümlelik yorum ve 1 aksiyon önerisi yaz.
    `.trim();

    const { text } = await ai.generate({
      model: proModel,
      system: CASHFLOW_SYSTEM_PROMPT,
      prompt: commentaryPrompt,
    });

    return {
      scenario: base.scenario,
      days: base.days,
      projection: base.projection,
      riskScore: base.riskScore,
      commentary: text,
      suggestedAction: text.split('.').slice(-2).join('.').trim(),
    };
  }
);
