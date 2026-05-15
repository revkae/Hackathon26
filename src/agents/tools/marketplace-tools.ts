import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

interface Listing {
  seller: string;
  title: string;
  price: number;
  rating: number;
  review_count: number;
}

interface MarketplaceFile {
  channel: string;
  competitors: { keyword: string; listings: Listing[] }[];
}

async function loadFile(filename: string): Promise<MarketplaceFile> {
  const filePath = path.join(process.cwd(), 'data', filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function getCompetitorPrices(keyword: string) {
  const files = ['trendyol-competitors.json', 'hepsiburada-prices.json', 'n11-listings.json'];
  const result: { channel: string; seller: string; title: string; price: number; rating: number; reviewCount: number }[] = [];

  for (const filename of files) {
    try {
      const data = await loadFile(filename);
      const match = data.competitors.find(c => c.keyword.toLowerCase() === keyword.toLowerCase());
      if (match) {
        for (const listing of match.listings) {
          result.push({
            channel: data.channel,
            seller: listing.seller,
            title: listing.title,
            price: listing.price,
            rating: listing.rating,
            reviewCount: listing.review_count,
          });
        }
      }
    } catch (e) {
      console.error(`Failed to load ${filename}:`, e);
    }
  }
  return result;
}

export const competitorPricesOutputSchema = z.array(z.object({
  channel: z.string(),
  seller: z.string(),
  title: z.string(),
  price: z.number(),
  rating: z.number(),
  reviewCount: z.number(),
}));

// Lazy Genkit tool factory — call registerTools() once inside a Genkit flow context
// so that env vars are available when the module is loaded at runtime.
export function registerMarketplaceTools(ai: { defineTool: Function }) {
  return ai.defineTool(
    {
      name: 'getCompetitorPrices',
      description: 'Returns competitor listings (with prices) across Trendyol, Hepsiburada, N11 for a given product keyword.',
      inputSchema: z.object({ keyword: z.string() }),
      outputSchema: competitorPricesOutputSchema,
    },
    async ({ keyword }: { keyword: string }) => getCompetitorPrices(keyword)
  );
}
