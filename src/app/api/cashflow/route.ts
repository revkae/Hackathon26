import { cashFlowAgent } from '@/agents/cashflow';
import { computeCashFlowBase } from '@/agents/tools/cashflow-compute';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { scenario, locale, withCommentary } = await req.json();

  // Fast path: deterministic projection only — used to update the chart
  // instantly while the (slow) Gemini commentary is fetched separately.
  if (!withCommentary) {
    const base = await computeCashFlowBase({ scenario: scenario ?? 'current', days: 90 });
    return NextResponse.json({
      scenario: base.scenario,
      days: base.days,
      projection: base.projection,
      riskScore: base.riskScore,
      commentary: '',
    });
  }

  const result = await cashFlowAgent({ scenario, days: 90, userLanguage: locale ?? 'tr' });
  return NextResponse.json(result);
}
