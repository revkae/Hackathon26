'use client';

import { type ReactNode } from 'react';
import { useAppMode } from './AppModeProvider';
import { useStoreConnections } from './StoreConnectionsProvider';
import { ConnectionRequired } from './ConnectionRequired';

export function RealModeGate({
  feature,
  platforms,
  children,
}: {
  feature: string;
  platforms?: string[];
  children: ReactNode;
}) {
  const { mode } = useAppMode();
  const { hasAnyMarketplace } = useStoreConnections();
  if (mode === 'real' && !hasAnyMarketplace) {
    return <ConnectionRequired feature={feature} platforms={platforms} />;
  }
  return <>{children}</>;
}
