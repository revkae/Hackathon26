import type { SupabaseClient } from '@supabase/supabase-js';

export interface ShopifyConnection {
  domain: string;
  token: string;
}

export interface StoreConnectionInfo {
  platform: string;
  domain: string;
  storeName: string;
}

// Full Shopify credentials for server-side fetching. Returns null when the
// current user has no Shopify connection.
export async function getShopifyConnection(
  supabase: SupabaseClient,
): Promise<ShopifyConnection | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('store_connections')
    .select('domain, access_token')
    .eq('profile_id', user.id)
    .eq('platform', 'shopify')
    .maybeSingle();
  if (!data) return null;
  return { domain: data.domain, token: data.access_token };
}

// Non-secret connection info (no token) for hydrating client UI.
export async function getStoreConnections(
  supabase: SupabaseClient,
): Promise<StoreConnectionInfo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('store_connections')
    .select('platform, domain, store_name')
    .eq('profile_id', user.id);
  return (data ?? []).map((r) => ({
    platform: r.platform,
    domain: r.domain,
    storeName: r.store_name,
  }));
}
