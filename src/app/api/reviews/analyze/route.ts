import { NextResponse } from 'next/server';
import { reviewsAgent } from '@/agents/reviews';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { locale?: string; daysBack?: number } = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty body */
  }

  try {
    const analysis = await reviewsAgent({
      daysBack: body.daysBack ?? 90,
      userLanguage: body.locale ?? 'tr',
    });
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
