'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconExternalLink, IconBuildingStore } from '@tabler/icons-react';

type Connection = { url: string; storeName: string };
type ConnectionMap = Record<string, Connection | undefined>;

const STORAGE_KEY = 'kobi-kaptani.marketplaces';

interface ViewStoreButtonProps {
  locale: string;
}

export function ViewStoreButton({ locale }: ViewStoreButtonProps) {
  const [primary, setPrimary] = useState<{ id: string; conn: Connection } | null>(null);
  const isTr = locale === 'tr';

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setPrimary(null);
          return;
        }
        const map = JSON.parse(raw) as ConnectionMap;
        const first = Object.entries(map).find(([, v]) => v && v.url);
        if (first && first[1]) setPrimary({ id: first[0], conn: first[1] });
        else setPrimary(null);
      } catch {
        setPrimary(null);
      }
    };

    read();
    // Keep button fresh if user connects/disconnects in another tab
    const handler = () => read();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (!primary) {
    return (
      <Link
        href={`/${locale}/dashboard/settings`}
        className="topbar-store-btn topbar-store-btn-empty"
        title={isTr ? 'Mağaza bağla' : 'Connect a store'}
      >
        <IconBuildingStore size={14} stroke={2.2} />
        <span className="topbar-store-btn-label">
          {isTr ? 'Mağaza Bağla' : 'Connect Store'}
        </span>
      </Link>
    );
  }

  const href = primary.conn.url.startsWith('http')
    ? primary.conn.url
    : `https://${primary.conn.url}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="topbar-store-btn"
      title={`${primary.conn.storeName} · ${primary.id}`}
    >
      <IconBuildingStore size={14} stroke={2.2} />
      <span className="topbar-store-btn-label">
        {isTr ? 'Mağazayı Aç' : 'Open Store'}
      </span>
      <IconExternalLink size={12} stroke={2.4} style={{ opacity: 0.6 }} />
    </a>
  );
}
