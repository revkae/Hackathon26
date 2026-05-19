'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { AppMode } from '@/lib/app-mode';
import type { MarketplaceId } from '@/lib/connections';

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

function normalizeDomain(raw: string): string {
  return raw.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

export async function saveStoreConnection(
  platform: MarketplaceId,
  conn: { domain: string; token: string; storeName: string },
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  const domain = normalizeDomain(conn.domain);
  if (!domain || !conn.token.trim() || !conn.storeName.trim()) {
    return { error: 'missing_fields' };
  }

  const { error } = await supabase.from('store_connections').upsert(
    {
      profile_id: user.id,
      platform,
      domain,
      access_token: conn.token.trim(),
      store_name: conn.storeName.trim(),
    },
    { onConflict: 'profile_id,platform' },
  );
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function removeStoreConnection(
  platform: MarketplaceId,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  const { error } = await supabase
    .from('store_connections')
    .delete()
    .eq('profile_id', user.id)
    .eq('platform', platform);
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}
