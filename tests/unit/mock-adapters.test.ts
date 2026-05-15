import { describe, it, expect } from 'vitest';
import { getCompetitorPrices } from '@/agents/tools/marketplace-tools';

describe('getCompetitorPrices', () => {
  it('returns competitors for matching keyword across all channels', async () => {
    const result = await getCompetitorPrices('el yapımı vazo');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(c => c.price > 0)).toBe(true);
    expect(new Set(result.map(c => c.channel)).size).toBeGreaterThanOrEqual(2);
  });

  it('returns empty array for unknown keyword', async () => {
    const result = await getCompetitorPrices('xyz123nonexistent');
    expect(result).toEqual([]);
  });
});
