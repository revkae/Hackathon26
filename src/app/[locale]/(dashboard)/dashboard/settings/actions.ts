'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { AppMode } from '@/lib/app-mode';

export async function setAppMode(next: AppMode): Promise<{ ok: true } | { error: string }> {
  if (next !== 'mock' && next !== 'real') return { error: 'invalid_mode' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  const { error } = await supabase
    .from('profiles')
    .update({ app_mode: next })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}
