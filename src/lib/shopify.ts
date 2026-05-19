import type { ShopifyProduct, ShopifyOrder } from './shopify-map';

export type { ShopifyProduct, ShopifyOrder };

interface ShopifyCreds {
  domain: string;
  token: string;
}

const API_VERSION = '2024-10';

function authHeaders(token: string): HeadersInit {
  return { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };
}

export async function fetchShopifyProducts(
  { domain, token }: ShopifyCreds,
): Promise<ShopifyProduct[]> {
  const url = `https://${domain}/admin/api/${API_VERSION}/products.json?limit=50`;
  const res = await fetch(url, { headers: authHeaders(token), cache: 'no-store' });
  if (!res.ok) throw new Error(`Shopify products API error: ${res.status}`);
  const data = (await res.json()) as { products: ShopifyProduct[] };
  return data.products;
}

export async function fetchShopifyOrders(
  { domain, token, sinceDays }: ShopifyCreds & { sinceDays: number },
): Promise<ShopifyOrder[]> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const url =
    `https://${domain}/admin/api/${API_VERSION}/orders.json` +
    `?status=any&created_at_min=${encodeURIComponent(since)}&limit=250`;
  const res = await fetch(url, { headers: authHeaders(token), cache: 'no-store' });
  if (!res.ok) throw new Error(`Shopify orders API error: ${res.status}`);
  const data = (await res.json()) as { orders: ShopifyOrder[] };
  return data.orders;
}
