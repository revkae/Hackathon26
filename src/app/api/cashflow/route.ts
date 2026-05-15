import { cashFlowAgent } from '@/agents/cashflow';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { scenario, locale } = await req.json();
  const result = await cashFlowAgent({ scenario, days: 90, userLanguage: locale ?? 'tr' });
  return NextResponse.json(result);
}
