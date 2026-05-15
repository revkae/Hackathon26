import { env } from './env';

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  variants: { id: number; price: string; sku: string }[];
  images: { src: string }[];
}

export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    return [];
  }
  const url = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/products.json?limit=50`;
  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
  const data = await res.json() as { products: ShopifyProduct[] };
  return data.products;
}

export async function fetchShopifyProduct(externalId: string): Promise<ShopifyProduct | null> {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_ADMIN_ACCESS_TOKEN) return null;
  const url = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/products/${externalId}.json`;
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN },
  });
  if (!res.ok) return null;
  const data = await res.json() as { product: ShopifyProduct };
  return data.product;
}
