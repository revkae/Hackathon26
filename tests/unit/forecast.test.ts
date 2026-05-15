import { describe, it, expect } from 'vitest';
import { movingAverage, projectCashFlow } from '@/agents/tools/forecast-math';

describe('movingAverage', () => {
  it('computes 7-day moving average', () => {
    const values = [10, 20, 30, 40, 50, 60, 70];
    expect(movingAverage(values, 7)).toBeCloseTo(40);
  });

  it('handles short arrays by using available length', () => {
    expect(movingAverage([10, 20], 7)).toBeCloseTo(15);
  });

  it('returns 0 for empty array', () => {
    expect(movingAverage([], 7)).toBe(0);
  });
});

describe('projectCashFlow', () => {
  it('projects forward N days using average daily revenue minus daily expense burn', () => {
    const result = projectCashFlow({
      currentBalance: 10000,
      dailyAvgRevenue: 500,
      dailyAvgExpense: 300,
      days: 30,
    });
    expect(result).toHaveLength(30);
    expect(result[0].balance).toBe(10000 + 500 - 300);
    expect(result[29].balance).toBe(10000 + 30 * (500 - 300));
  });

  it('handles negative projections', () => {
    const result = projectCashFlow({
      currentBalance: 1000,
      dailyAvgRevenue: 100,
      dailyAvgExpense: 200,
      days: 20,
    });
    expect(result[19].balance).toBeLessThan(0);
  });
});
