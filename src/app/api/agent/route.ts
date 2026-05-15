import { createClient } from '@/lib/supabase/server';
import { captainAgent } from '@/agents/captain';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs'; // CRITICAL: Genkit requires Node, not Edge

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { query, locale } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const startTime = Date.now();
        const result = await captainAgent({ query, userLanguage: locale ?? 'tr' });
        const durationMs = Date.now() - startTime;

        // Persist trace
        await supabase.from('agent_traces').insert({
          profile_id: user.id,
          query,
          trace_json: result as unknown as Record<string, unknown>,
          duration_ms: durationMs,
        });

        controller.enqueue(encoder.encode(JSON.stringify({ type: 'final', data: result }) + '\n'));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message }) + '\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
