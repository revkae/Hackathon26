// Shopify Admin REST payload shapes (only the fields this app reads) and the
// pure helpers that map them onto the shapes the dashboard already consumes.

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  variants: { id: number; price: string; sku: string }[];
  images: { src: string }[];
}

export interface ShopifyOrder {
  id: number;
  created_at: string;
  total_price: string;
}

export interface MappedProduct {
  name: string;
  price: number | null;
  category: string | null;
  channels: string[];
  imageUrl?: string;
}

export function mapShopifyProduct(p: ShopifyProduct): MappedProduct {
  const raw = p.variants[0]?.price;
  const price = raw != null ? Number.parseFloat(raw) : Number.NaN;
  return {
    name: p.title,
    price: Number.isFinite(price) ? price : null,
    category: p.product_type || null,
    channels: ['Shopify'],
    imageUrl: p.images[0]?.src,
  };
}

export function mapShopifyOrdersToSales(
  orders: ShopifyOrder[],
): { date: string; revenue: number }[] {
  const byDay: Record<string, number> = {};
  for (const o of orders) {
    const day = o.created_at.slice(0, 10);
    const amount = Number.parseFloat(o.total_price);
    if (!Number.isFinite(amount)) continue;
    byDay[day] = (byDay[day] ?? 0) + amount;
  }
  return Object.entries(byDay)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
