import { z } from 'zod';
import { ai } from '../genkit';
import { createClient } from '@/lib/supabase/server';

export const getReviewsTool = ai.defineTool(
  {
    name: 'getReviews',
    description: 'Returns recent reviews for a product or all products in a date range.',
    inputSchema: z.object({
      productId: z.string().optional(),
      daysBack: z.number().default(90),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      productId: z.string(),
      channel: z.string(),
      language: z.string().nullable(),
      rating: z.number(),
      body: z.string(),
      postedAt: z.string().nullable(),
    })),
  },
  async ({ productId, daysBack }) => {
    const supabase = await createClient();
    const sinceDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from('reviews')
      .select('id, product_id, channel, language, rating, body, posted_at')
      .gte('posted_at', sinceDate);
    if (productId) query = query.eq('product_id', productId);
    const { data } = await query.limit(200);
    return (data ?? []).map(r => ({
      id: r.id, productId: r.product_id, channel: r.channel,
      language: r.language, rating: r.rating, body: r.body, postedAt: r.posted_at,
    }));
  }
);
