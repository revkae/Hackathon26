import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/ProductCard';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, current_price, category, channels, images');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ürünler</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(products ?? []).map(p => (
          <ProductCard
            key={p.id}
            name={p.name}
            price={p.current_price}
            category={p.category}
            channels={(p.channels as string[]) ?? []}
            imageUrl={(p.images as string[])?.[0]}
          />
        ))}
      </div>
    </div>
  );
}
