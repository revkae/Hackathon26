import { createClient } from '@/lib/supabase/server';
import { SocialClient } from './SocialClient';

export const dynamic = 'force-dynamic';

export default async function SocialPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, category, current_price, images')
    .limit(20);

  return (
    <SocialClient
      locale={locale}
      products={(products ?? []).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category ?? '',
        price: p.current_price ?? null,
        imageUrl: (p.images as string[])?.[0] ?? null,
      }))}
    />
  );
}
