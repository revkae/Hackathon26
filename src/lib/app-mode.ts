import type { SupabaseClient } from '@supabase/supabase-js';

export type AppMode = 'mock' | 'real';

export async function getAppMode(supabase: SupabaseClient): Promise<AppMode> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'mock';

  const { data } = await supabase
    .from('profiles')
    .select('app_mode')
    .eq('id', user.id)
    .single();

  const mode = (data?.app_mode as AppMode | null) ?? 'mock';
  return mode === 'real' ? 'real' : 'mock';
}
