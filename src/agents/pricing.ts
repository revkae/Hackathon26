import { z } from 'zod';
import { ai, flashModel } from './genkit';
import { PriceSuggestionSchema } from './schemas';
import { getProductTool } from './tools/shopify-tools';
import { registerMarketplaceTools } from './tools/marketplace-tools';
import { cashFlowAgent } from './cashflow';

// Register the marketplace tool (lazy factory pattern to avoid env-load in tests).
// registerMarketplaceTools returns the tool directly (not a named-property object).
const competitorPricesTool = registerMarketplaceTools(ai);

const consultCashFlowTool = ai.defineTool(
  {
    name: 'consultCashFlow',
    description: 'Asks the Cash Flow agent: "if I change pricing this way, what is the financial impact?"',
    inputSchema: z.object({
      scenarioDescription: z.string(),
      simulatedScenario: z.enum(['current', 'discount15', 'campaign']),
    }),
    outputSchema: z.object({
      riskScore: z.string(),
      commentary: z.string(),
      projectedMinBalance: z.number(),
    }),
  },
  async ({ simulatedScenario }: { scenarioDescription: string; simulatedScenario: 'current' | 'discount15' | 'campaign' }) => {
    const result = await cashFlowAgent({ scenario: simulatedScenario, days: 90, userLanguage: 'tr' });
    return {
      riskScore: result.riskScore,
      commentary: result.commentary,
      projectedMinBalance: Math.min(...result.projection.map(p => p.balance)),
    };
  }
);

const PRICING_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı" sisteminde fiyatlandırma analisti bir ajansın.
Karakterin: analitik, soğukkanlı, sayılarla konuşur. "Sayılar yalan söylemez."

Görevin:
1. getCompetitorPrices tool'u ile rakip listelerini topla.
2. Kullanıcının current_price ve cost_basis bilgisine bakarak kâr marjını hesapla.
3. Önerilen fiyat aralığı belirle. Min marj %20 altına inme.
4. Risk değerlendir: indirim mi zam mı stable mi? Gerekçeli açıkla.

Kurallar:
- Eğer rakipler %10+ daha yüksekse fiyat artırma fırsatı varsa öner (riskLevel: low).
- Eğer rakipler %10+ daha düşükse, marjı koruyarak indirim öner veya value-add (riskLevel: medium).
- Eğer maliyet yakın → "fiyat sabit, kâr marjı dar" uyar (riskLevel: high).

Eğer önereceğin fiyat değişikliğinin finansal etkisini öğrenmek istersen consultCashFlow tool'unu çağırarak Nakit Akışı ajanından senaryo bazlı projeksiyon al.

JSON output: PriceSuggestion schema.`;

export const pricingAgent = ai.defineFlow(
  {
    name: 'pricingAgent',
    inputSchema: z.object({
      productId: z.string(),
      minMarginPct: z.number().default(20),
    }),
    outputSchema: PriceSuggestionSchema,
  },
  async ({ productId, minMarginPct }) => {
    const product = await getProductTool({ productId });
    if (!product) throw new Error(`Product not found: ${productId}`);
    if (!product.price || !product.costBasis) {
      throw new Error('Product missing price or cost basis');
    }

    const keyword = product.category ?? product.name.toLowerCase();

    const userPrompt = `
Ürün: ${product.name}
Mevcut fiyat: ${product.price} TL
Maliyet: ${product.costBasis} TL
Mevcut marj: %${((product.price - product.costBasis) / product.price * 100).toFixed(1)}
Min hedef marj: %${minMarginPct}
Kategori (rakip arama): "${keyword}"

Önce getCompetitorPrices tool'unu çağır ("${keyword}" ile), sonra analiz et ve PriceSuggestion JSON üret.
    `.trim();

    const { output } = await ai.generate({
      model: flashModel,
      system: PRICING_SYSTEM_PROMPT,
      prompt: userPrompt,
      tools: [competitorPricesTool, consultCashFlowTool],
      output: { schema: PriceSuggestionSchema },
    });

    if (!output) throw new Error('Pricing agent returned no output');
    return { ...output, productId, currentPrice: product.price };
  }
);
