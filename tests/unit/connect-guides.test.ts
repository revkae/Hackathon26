import { describe, it, expect } from 'vitest';
import { GUIDES, type PlatformWithGuide } from '@/lib/connect-guides';

const REQUIRED: PlatformWithGuide[] = [
  'shopify',
  'trendyol',
  'hepsiburada',
  'etsy',
  'instagram',
];

describe('connect guides registry', () => {
  it('has an entry for every required platform', () => {
    for (const p of REQUIRED) {
      expect(GUIDES[p], `missing guide for ${p}`).toBeDefined();
      expect(GUIDES[p].steps.length).toBeGreaterThan(0);
      expect(GUIDES[p].title.tr).toBeTruthy();
      expect(GUIDES[p].title.en).toBeTruthy();
    }
  });
});
