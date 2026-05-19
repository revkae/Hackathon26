import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as { title?: string };
  if (!body.title || body.title.trim().length === 0) {
    return Response.json({ error: 'title_required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('conversations')
    .update({ title: body.title.trim() })
    .eq('id', id)
    .eq('profile_id', user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
