'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { MarketplaceId } from '@/lib/connections';
import {
  saveStoreConnection,
  removeStoreConnection,
} from '@/app/[locale]/(dashboard)/dashboard/settings/actions';

export interface MarketplaceConn {
  domain: string;
  storeName: string;
}

export type MarketplaceConnMap = Partial<Record<MarketplaceId, MarketplaceConn>>;

type ActionResult = { ok: true } | { error: string };

interface StoreConnectionsValue {
  marketplaces: MarketplaceConnMap;
  hasAnyMarketplace: boolean;
  connect: (
    platform: MarketplaceId,
    conn: { domain: string; storeName: string; token: string },
  ) => Promise<ActionResult>;
  disconnect: (platform: MarketplaceId) => Promise<ActionResult>;
}

const StoreConnectionsContext = createContext<StoreConnectionsValue | null>(null);

export function StoreConnectionsProvider({
  initial,
  children,
}: {
  initial: MarketplaceConnMap;
  children: ReactNode;
}) {
  const [marketplaces, setMarketplaces] = useState<MarketplaceConnMap>(initial);

  const connect = useCallback<StoreConnectionsValue['connect']>(
    async (platform, conn) => {
      // Optimistic: show the connection immediately.
      setMarketplaces((m) => ({
        ...m,
        [platform]: { domain: conn.domain, storeName: conn.storeName },
      }));
      const res = await saveStoreConnection(platform, conn);
      // On failure, drop just this platform's optimistic entry — connect only
      // ever adds a new entry, so removing it is the correct revert.
      if ('error' in res) {
        setMarketplaces((m) => {
          const next = { ...m };
          delete next[platform];
          return next;
        });
      }
      return res;
    },
    [],
  );

  const disconnect = useCallback<StoreConnectionsValue['disconnect']>(
    async (platform) => {
      // Optimistic: remove immediately, capturing the entry for revert.
      let removed: MarketplaceConn | undefined;
      setMarketplaces((m) => {
        removed = m[platform];
        const next = { ...m };
        delete next[platform];
        return next;
      });
      const res = await removeStoreConnection(platform);
      if ('error' in res && removed) {
        const restored = removed;
        setMarketplaces((m) => ({ ...m, [platform]: restored }));
      }
      return res;
    },
    [],
  );

  return (
    <StoreConnectionsContext.Provider
      value={{
        marketplaces,
        hasAnyMarketplace: Object.keys(marketplaces).length > 0,
        connect,
        disconnect,
      }}
    >
      {children}
    </StoreConnectionsContext.Provider>
  );
}

export function useStoreConnections(): StoreConnectionsValue {
  const ctx = useContext(StoreConnectionsContext);
  if (!ctx) {
    throw new Error('useStoreConnections must be used inside <StoreConnectionsProvider>');
  }
  return ctx;
}
