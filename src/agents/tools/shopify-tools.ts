import { z } from 'zod';
import { ai } from '../genkit';
import { createClient } from '@/lib/supabase/server';

export const listProductsTool = ai.defineTool(
  {
    name: 'listProducts',
    description: 'Returns the list of products owned by the current user (combines Supabase + Shopify dev store).',
    inputSchema: z.object({}),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      price: z.number().nullable(),
      category: z.string().nullable(),
      channels: z.array(z.string()),
    })),
  },
  async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('products').select('id, name, description, current_price, category, channels')
      .eq('profile_id', user.id);
    return (data ?? []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.current_price,
      category: p.category,
      channels: p.channels as string[],
    }));
  }
);

export const getProductTool = ai.defineTool(
  {
    name: 'getProduct',
    description: 'Gets full details of a specific product by ID.',
    inputSchema: z.object({ productId: z.string() }),
    outputSchema: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      price: z.number().nullable(),
      costBasis: z.number().nullable(),
      category: z.string().nullable(),
      images: z.array(z.string()),
      channels: z.array(z.string()),
    }).nullable(),
  },
  async ({ productId }) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('id, name, description, current_price, cost_basis, category, images, channels')
      .eq('id', productId).maybeSingle();
    if (!data) return null;
    return {
      id: data.id, name: data.name, description: data.description,
      price: data.current_price, costBasis: data.cost_basis,
      category: data.category,
      images: (data.images as string[]) ?? [],
      channels: data.channels as string[],
    };
  }
);
