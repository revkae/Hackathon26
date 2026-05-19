import { z } from 'zod';
import { ai, proModel } from './genkit';
import { CaptainBriefSchema } from './schemas';
import { listProductsTool, getProductTool } from './tools/shopify-tools';
import { seoAgent } from './seo';
import { marketingAgent } from './marketing';
import { pricingAgent } from './pricing';

const runSeoTool = ai.defineTool(
  {
    name: 'runSeoAgent',
    description: 'Runs the SEO specialist agent on a specific product. Returns title suggestion.',
    inputSchema: z.object({ productId: z.string() }),
    outputSchema: z.object({ newTitle: z.string(), reasoning: z.string() }),
  },
  async ({ productId }) => {
    const result = await seoAgent({ productId });
    return { newTitle: result.newTitle, reasoning: result.reasoning };
  }
);

const runMarketingTool = ai.defineTool(
  {
    name: 'runMarketingAgent',
    description: 'Runs the Marketing specialist agent. Generates Instagram caption + hashtags + image prompts.',
    inputSchema: z.object({
      productId: z.string(),
      tone: z.enum(['casual', 'professional', 'premium']).default('casual'),
    }),
    outputSchema: z.object({ caption: z.string(), hashtags: z.array(z.string()) }),
  },
  async ({ productId, tone }) => {
    const result = await marketingAgent({ productId, tone });
    return { caption: result.caption, hashtags: result.hashtags };
  }
);

const runPricingTool = ai.defineTool(
  {
    name: 'runPricingAgent',
    description: 'Runs the Pricing specialist agent. Returns competitor-aware price suggestion.',
    inputSchema: z.object({ productId: z.string() }),
    outputSchema: z.object({
      suggestedPrice: z.number(),
      reasoning: z.string(),
      riskLevel: z.string(),
    }),
  },
  async ({ productId }) => {
    const result = await pricingAgent({ productId, minMarginPct: 20 });
    return {
      suggestedPrice: result.suggestedPrice,
      reasoning: result.reasoning,
      riskLevel: result.riskLevel,
    };
  }
);

const CAPTAIN_SYSTEM_PROMPT = `Sen "KOBİ Kaptanı"sın — küçük işletme sahibinin sağ kolu, lider asistan.
Karakterin: profesyonel, lider, "ekibe nasıl en iyi sonucu aldırır?" mantığıyla çalışır.

Sahip olduğun uzman ajanlar (tool olarak çağırabilirsin):
- runSeoAgent: ürün başlığını optimize eder
- runMarketingAgent: sosyal medya postu üretir
- runPricingAgent: rakip fiyatlarına göre fiyat önerir
- listProducts: kullanıcının tüm ürünlerini listeler
- getProduct: bir ürünün detaylarını gösterir

Görevin:
1. Kullanıcının doğal dil sorusunu anla ve hangi uzman(lar)ı çağırman gerektiğini düşün.
2. Gerekiyorsa birden çok uzmanı paralel çağır (kod yapısı buna izin verir).
3. Sonuçları kullanıcıya OKUNABILIR, ÖZ, ve EYLEME GEÇİRİLEBİLİR şekilde sun.
4. Cevabını schema'ya uygun yapılandır.

Kullanıcının dilini takip et: kullanıcı Türkçe yazarsa Türkçe, İngilizce yazarsa İngilizce yanıt ver.

Eğer kullanıcı "bu hafta ne yapmalıyım?" gibi geniş bir soru sorarsa:
- En kritik 3 ürünü belirle (listProducts ile)
- Her biri için en kritik 1 aksiyon öner
- Kısa brief halinde sun`;

export const captainAgent = ai.defineFlow(
  {
    name: 'captainAgent',
    inputSchema: z.object({
      query: z.string(),
      userLanguage: z.string().default('tr'),
    }),
    outputSchema: CaptainBriefSchema,
  },
  async ({ query, userLanguage }) => {
    const { output } = await ai.generate({
      model: proModel,
      system: CAPTAIN_SYSTEM_PROMPT,
      prompt: `Kullanıcı dili: ${userLanguage}\nSoru: ${query}`,
      tools: [runSeoTool, runMarketingTool, runPricingTool, listProductsTool, getProductTool],
      output: { schema: CaptainBriefSchema },
    });

    if (!output) throw new Error('Captain returned no output');
    return output;
  }
);

export interface CaptainCallbacks {
  onToolCall?: (tool: string) => void;
}

// New: wrapper that accepts callbacks the API route uses to forward progress events.
export async function runCaptainWithCallbacks(
  input: { query: string; userLanguage: string },
  callbacks: CaptainCallbacks,
): Promise<z.infer<typeof CaptainBriefSchema>> {
  const TOOL_TO_HUMAN: Record<string, string> = {
    runSeoAgent: 'SEO ajanı',
    runMarketingAgent: 'Pazarlama ajanı',
    runPricingAgent: 'Fiyat ajanı',
    listProducts: 'Ürün listesi',
    getProduct: 'Ürün detayı',
  };

  const { output } = await ai.generate({
    model: proModel,
    system: CAPTAIN_SYSTEM_PROMPT,
    prompt: `Kullanıcı dili: ${input.userLanguage}\nSoru: ${input.query}`,
    tools: [runSeoTool, runMarketingTool, runPricingTool, listProductsTool, getProductTool],
    output: { schema: CaptainBriefSchema },
    onChunk: (chunk) => {
      const calls = chunk.toolRequests ?? [];
      for (const call of calls) {
        const human = TOOL_TO_HUMAN[call.toolRequest.name] ?? call.toolRequest.name;
        callbacks.onToolCall?.(human);
      }
    },
  });

  if (!output) throw new Error('Captain returned no output');
  return output;
}
