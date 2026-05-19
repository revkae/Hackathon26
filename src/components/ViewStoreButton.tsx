'use client';

import Link from 'next/link';
import { IconExternalLink, IconBuildingStore } from '@tabler/icons-react';
import { useStoreConnections } from './StoreConnectionsProvider';

interface ViewStoreButtonProps {
  locale: string;
}

export function ViewStoreButton({ locale }: ViewStoreButtonProps) {
  const { marketplaces } = useStoreConnections();
  const isTr = locale === 'tr';

  const entry = Object.entries(marketplaces).find(([, v]) => v);
  const primary = entry && entry[1] ? { id: entry[0], conn: entry[1] } : null;

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

  return (
    <a
      href={`https://${primary.conn.domain}`}
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
