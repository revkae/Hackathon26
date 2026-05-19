import { describe, it, expect } from 'vitest';
import {
  mapShopifyProduct,
  mapShopifyOrdersToSales,
  type ShopifyProduct,
  type ShopifyOrder,
} from '@/lib/shopify-map';

const product: ShopifyProduct = {
  id: 1,
  title: 'El Yapımı Mavi Vazo',
  body_html: '<p>desc</p>',
  vendor: 'Ayşe',
  product_type: 'vazo',
  tags: 'seramik',
  variants: [{ id: 11, price: '280.00', sku: 'V-1' }],
  images: [{ src: 'https://cdn.shopify.com/v.jpg' }],
};

describe('mapShopifyProduct', () => {
  it('maps a Shopify product to the ProductCard shape', () => {
    expect(mapShopifyProduct(product)).toEqual({
      name: 'El Yapımı Mavi Vazo',
      price: 280,
      category: 'vazo',
      channels: ['Shopify'],
      imageUrl: 'https://cdn.shopify.com/v.jpg',
    });
  });

  it('tolerates missing variant price, product_type and images', () => {
    const bare: ShopifyProduct = {
      ...product, product_type: '', variants: [], images: [],
    };
    const mapped = mapShopifyProduct(bare);
    expect(mapped.price).toBeNull();
    expect(mapped.category).toBeNull();
    expect(mapped.imageUrl).toBeUndefined();
  });
});

describe('mapShopifyOrdersToSales', () => {
  it('groups orders by day and sums total_price', () => {
    const orders: ShopifyOrder[] = [
      { id: 1, created_at: '2026-05-18T09:00:00Z', total_price: '100.50' },
      { id: 2, created_at: '2026-05-18T18:00:00Z', total_price: '49.50' },
      { id: 3, created_at: '2026-05-19T10:00:00Z', total_price: '200.00' },
    ];
    expect(mapShopifyOrdersToSales(orders)).toEqual([
      { date: '2026-05-18', revenue: 150 },
      { date: '2026-05-19', revenue: 200 },
    ]);
  });

  it('returns an empty array for no orders', () => {
    expect(mapShopifyOrdersToSales([])).toEqual([]);
  });

  it('skips orders with a non-numeric total_price', () => {
    const orders: ShopifyOrder[] = [
      { id: 1, created_at: '2026-05-18T09:00:00Z', total_price: 'abc' },
      { id: 2, created_at: '2026-05-18T12:00:00Z', total_price: '50.00' },
    ];
    expect(mapShopifyOrdersToSales(orders)).toEqual([
      { date: '2026-05-18', revenue: 50 },
    ]);
  });
});
