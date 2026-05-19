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

/** Strip stray markdown the model may emit despite the plain-text instruction. */
function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')     // italic
    .replace(/`([^`]+)`/g, '$1')       // inline code
    .replace(/^\s*#{1,6}\s*/gm, '')    // headings
    .replace(/^\s*[-*•]\s+/gm, '')     // bullets
    .replace(/\*+/g, '')               // leftover asterisks
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Splits the model's reply into a clean commentary paragraph and a single
 * action line. The model is asked to prefix the action with "Aksiyon:" /
 * "Action:" — cutting there keeps the action from duplicating inside the
 * commentary text (and out of the UI's "→" line).
 */
function splitCommentary(raw: string): { commentary: string; suggestedAction: string } {
  const text = stripMarkdown(raw);
  const marker = text.match(/(?:^|\n)\s*(?:Aksiyon|Action|Öneri|Recommendation)\s*:\s*/i);
  if (marker && marker.index !== undefined) {
    return {
      commentary: text.slice(0, marker.index).trim(),
      suggestedAction: text
        .slice(marker.index + marker[0].length)
        .trim()
        .replace(/\s*\n+\s*/g, ' '),
    };
  }
  // Fallback: treat the last sentence as the action.
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length > 1) {
    return {
      commentary: sentences.slice(0, -1).join(' '),
      suggestedAction: sentences[sentences.length - 1],
    };
  }
  return { commentary: text, suggestedAction: '' };
}

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
    const actionLabel = userLanguage === 'tr' ? 'Aksiyon' : 'Action';
    const commentaryPrompt = `
Senaryo: ${scenario}
Mevcut bakiye: ${base.currentBalance.toFixed(0)} TL
Günlük ortalama gelir: ${base.adjustedRevenue.toFixed(0)} TL
Günlük ortalama gider: ${base.dailyAvgExpense.toFixed(0)} TL
${days} gün sonra projekte bakiye: ${base.projectedEnd.toFixed(0)} TL
Minimum bakiye dönemi: ${base.minBalance.toFixed(0)} TL
Risk skoru: ${base.riskScore}

${userLanguage === 'tr' ? 'TÜRKÇE' : 'ENGLISH'} olarak yanıt ver. Biçim kuralları (KESİN):
- Markdown KULLANMA: yıldız (*), kalın yazı, başlık, madde işareti YOK — sadece düz metin.
- Önce 2-3 cümlelik durum yorumu yaz.
- Sonra yeni bir satıra geç ve TEK bir aksiyon önerisi yaz, başına "${actionLabel}: " ekle.
- "${actionLabel}: " etiketini yorum kısmında veya birden fazla kez kullanma.
    `.trim();

    const { text } = await ai.generate({
      model: proModel,
      system: CASHFLOW_SYSTEM_PROMPT,
      prompt: commentaryPrompt,
    });

    const { commentary, suggestedAction } = splitCommentary(text);

    return {
      scenario: base.scenario,
      days: base.days,
      projection: base.projection,
      riskScore: base.riskScore,
      commentary,
      suggestedAction,
    };
  }
);
