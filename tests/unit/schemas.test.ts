import { describe, it, expect } from 'vitest';
import { SeoSuggestionSchema, PriceSuggestionSchema, BriefItemSchema } from '@/agents/schemas';

describe('SeoSuggestionSchema', () => {
  it('accepts a valid suggestion', () => {
    const valid = {
      productId: 'abc',
      oldTitle: 'mavi vazo',
      newTitle: 'El Yapımı Mavi Doğum Günü Hediyesi Vazo',
      reasoning: 'Keyword density iyileştirildi',
      expectedImpact: 'medium' as const,
    };
    expect(SeoSuggestionSchema.parse(valid)).toEqual(valid);
  });

  it('rejects empty newTitle', () => {
    const invalid = { productId: 'a', oldTitle: 'x', newTitle: '', reasoning: 'y', expectedImpact: 'low' as const };
    expect(() => SeoSuggestionSchema.parse(invalid)).toThrow();
  });
});

describe('BriefItemSchema', () => {
  it('accepts known statuses', () => {
    for (const status of ['ok', 'warn', 'critical', 'info'] as const) {
      expect(BriefItemSchema.parse({ status, text: 'test' }).status).toBe(status);
    }
  });
});
