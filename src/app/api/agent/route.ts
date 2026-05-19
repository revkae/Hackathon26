import { createClient } from '@/lib/supabase/server';
import { runCaptainWithCallbacks } from '@/agents/captain';
import { getAppMode } from '@/lib/app-mode';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

type ErrorCode =
  | 'gemini_unauthorized'
  | 'gemini_quota'
  | 'no_tools_called'
  | 'unknown';

function classifyError(err: unknown): { code: ErrorCode; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  const low = message.toLowerCase();
  if (low.includes('unauthorized') || low.includes('api key') || low.includes('401')) {
    return { code: 'gemini_unauthorized', message: 'Gemini API anahtarı eksik veya hatalı.' };
  }
  if (low.includes('quota') || low.includes('429')) {
    return { code: 'gemini_quota', message: 'Gemini kotası doldu — biraz bekle ve tekrar dene.' };
  }
  if (low.includes('returned no output')) {
    return { code: 'no_tools_called', message: 'Kaptan bir cevap üretemedi — soruyu farklı ifade et.' };
  }
  return { code: 'unknown', message };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { query, locale, conversationId: incomingConversationId } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      try {
        const mode = await getAppMode(supabase);

        // 1) Ensure a conversation exists; create one if not provided.
        let conversationId = incomingConversationId as string | undefined;
        if (!conversationId) {
          const { data: convo, error: convoErr } = await supabase
            .from('conversations')
            .insert({ profile_id: user.id, title: query.slice(0, 40) })
            .select('id')
            .single();
          if (convoErr || !convo) throw new Error(convoErr?.message ?? 'conversation create failed');
          conversationId = convo.id;
          emit({ type: 'conversation_created', conversationId });
        }

        // 2) Persist the user message.
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          text: query,
        });

        // 3) Initial thinking ping so the UI updates within ~50ms.
        emit({ type: 'thinking', stage: 'planning' });

        // 4) Run the captain with tool-call callbacks → forward each as a 'thinking' event.
        const startTime = Date.now();
        const result = await runCaptainWithCallbacks(
          { query, userLanguage: locale ?? 'tr' },
          {
            onToolCall: (toolHuman) => {
              emit({ type: 'thinking', stage: 'tool_call', tool: toolHuman });
            },
          },
        );
        const durationMs = Date.now() - startTime;

        // 5) Persist trace + captain message.
        const captainText = `${result.greeting}\n\n${result.topPriority ?? ''}`.trim();
        await Promise.all([
          supabase.from('agent_traces').insert({
            profile_id: user.id,
            query,
            trace_json: { ...(result as unknown as Record<string, unknown>), mode },
            duration_ms: durationMs,
          }),
          supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'captain',
            text: captainText,
            brief_json: result as unknown as Record<string, unknown>,
          }),
          supabase.from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId),
        ]);

        emit({ type: 'final', conversationId, data: result });
        controller.close();
      } catch (err) {
        const { code, message } = classifyError(err);
        emit({ type: 'error', code, message });
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
