'use client';

import { useEffect, useState } from 'react';

export type MarketplaceId = 'shopify' | 'trendyol' | 'hepsiburada' | 'etsy';
export type SocialId = 'instagram' | 'twitter' | 'facebook';
export type PlatformId = MarketplaceId | SocialId;

export interface MarketplaceConnection {
  url: string;
  key: string;
  storeName: string;
  connectedAt: string;
}

export interface SocialConnection {
  handle: string;
  token: string;
  displayName: string;
  connectedAt: string;
}

export type MarketplaceMap = Partial<Record<MarketplaceId, MarketplaceConnection>>;
export type SocialMap = Partial<Record<SocialId, SocialConnection>>;

export const MARKETPLACES_STORAGE_KEY = 'kobi-kaptani.marketplaces';
export const SOCIALS_STORAGE_KEY      = 'kobi-kaptani.socials';

function readMap<T extends Record<string, unknown>>(key: string): T {
  if (typeof window === 'undefined') return {} as T;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function writeMap<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Same-window listeners (storage event doesn't fire on the writing tab)
    window.dispatchEvent(new Event(`${key}:changed`));
  } catch {
    /* ignore */
  }
}

function useStoredMap<T extends Record<string, unknown>>(key: string): [T, (next: T) => void] {
  const [state, setState] = useState<T>({} as T);

  useEffect(() => {
    setState(readMap<T>(key));
    const handler = () => setState(readMap<T>(key));
    window.addEventListener(`${key}:changed`, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(`${key}:changed`, handler);
      window.removeEventListener('storage', handler);
    };
  }, [key]);

  const save = (next: T) => {
    setState(next);
    writeMap(key, next);
  };

  return [state, save];
}

export function useConnections() {
  const [marketplaces, setMarketplaces] = useStoredMap<MarketplaceMap>(MARKETPLACES_STORAGE_KEY);
  const [socials, setSocials]           = useStoredMap<SocialMap>(SOCIALS_STORAGE_KEY);

  return {
    marketplaces,
    socials,
    setMarketplaces,
    setSocials,
    hasAnyMarketplace: Object.keys(marketplaces).length > 0,
    hasMarketplace: (id: MarketplaceId) => Boolean(marketplaces[id]),
    hasSocial:      (id: SocialId)      => Boolean(socials[id]),
  };
}
