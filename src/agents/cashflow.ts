import { z } from 'zod';
import { ai, proModel } from './genkit';
import { CashFlowForecastSchema } from './schemas';
import { fetchSalesHistory, fetchPendingExpenses, projectCashFlow, movingAverage } from './tools/forecast';
import { createClient } from '@/lib/supabase/server';

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
    // 1. Pull data via the existing helpers (these handle Supabase + auth)
    const sales = await fetchSalesHistory(days);
    const expenses = await fetchPendingExpenses(days);

    // 2. Compute current balance (rough: sum recent sales minus a fraction of pending)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    let currentBalance = 0;
    if (userId) {
      const { data: salesAll } = await supabase
        .from('sales').select('total_revenue').eq('profile_id', userId);
      currentBalance = (salesAll ?? []).reduce((s: number, r: { total_revenue: number }) => s + r.total_revenue, 0)
        - expenses.reduce((s, e) => s + e.amount, 0) * 0.3;
    }

    // 3. Daily averages
    const salesValues = sales.map(s => s.revenue);
    const dailyAvgRevenue = movingAverage(salesValues, 30);
    const dailyAvgExpense = expenses.reduce((s, e) => s + e.amount, 0) / days;

    // 4. Apply scenario adjustment
    let adjustedRevenue = dailyAvgRevenue;
    if (scenario === 'discount15') adjustedRevenue = dailyAvgRevenue * 1.05; // ~5% volume bump, but 15% margin loss
    if (scenario === 'campaign') adjustedRevenue = dailyAvgRevenue * 1.25;

    const projection = projectCashFlow({
      currentBalance,
      dailyAvgRevenue: adjustedRevenue,
      dailyAvgExpense,
      days,
    });

    const minBalance = Math.min(...projection.map(p => p.balance));
    const riskScore: 'green' | 'yellow' | 'red' =
      minBalance < 0 ? 'red' :
      minBalance < currentBalance * 0.3 ? 'yellow' : 'green';

    // 5. Ask Gemini for commentary
    const commentaryPrompt = `
Senaryo: ${scenario}
Mevcut bakiye: ${currentBalance.toFixed(0)} TL
Günlük ortalama gelir: ${adjustedRevenue.toFixed(0)} TL
Günlük ortalama gider: ${dailyAvgExpense.toFixed(0)} TL
${days} gün sonra projekte bakiye: ${projection[projection.length - 1].balance.toFixed(0)} TL
Minimum bakiye dönemi: ${minBalance.toFixed(0)} TL
Risk skoru: ${riskScore}

${userLanguage === 'tr' ? 'TÜRKÇE' : 'ENGLISH'} olarak 2-3 cümlelik yorum ve 1 aksiyon önerisi yaz.
    `.trim();

    const { text } = await ai.generate({
      model: proModel,
      system: CASHFLOW_SYSTEM_PROMPT,
      prompt: commentaryPrompt,
    });

    return {
      scenario,
      days,
      projection,
      riskScore,
      commentary: text,
      suggestedAction: text.split('.').slice(-2).join('.').trim(),
    };
  }
);
