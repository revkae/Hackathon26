'use client';

import { useEffect, useState, useTransition } from 'react';
import { Switch } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBrandShopee,
  IconBuildingStore,
  IconCheck,
  IconExternalLink,
  IconHelp,
  IconSettings as IconMode,
  IconShoppingCart,
  IconTag,
  IconX,
} from '@tabler/icons-react';
import { useAppMode } from '@/components/AppModeProvider';
import { useConnections } from '@/lib/connections';
import { ConnectHelpModal } from '@/components/ConnectHelpModal';
import type { PlatformWithGuide } from '@/lib/connect-guides';
import { setAppMode } from './actions';

interface MarketplaceDef {
  id: 'shopify' | 'trendyol' | 'hepsiburada' | 'etsy';
  name: string;
  blurb: { tr: string; en: string };
  accent: string;
  Icon: React.ComponentType<{ size?: number; stroke?: number }>;
  urlHint: string;
  keyHint: string;
}

interface Connection {
  url: string;
  key: string;
  storeName: string;
  connectedAt: string;
}

type ConnectionMap = Partial<Record<MarketplaceDef['id'], Connection>>;

const MARKETPLACES: MarketplaceDef[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    blurb: {
      tr: 'Tüm ürünler, sipariş ve müşteri verisi anlık senkron.',
      en: 'Live sync of products, orders, and customer data.',
    },
    accent: 'var(--c-emerald)',
    Icon: IconBrandShopee,
    urlHint: 'magaza-adin.myshopify.com',
    keyHint: 'shpat_•••• Admin API token',
  },
  {
    id: 'trendyol',
    name: 'Trendyol',
    blurb: {
      tr: 'Pazaryeri sıralaması ve rakip fiyat takibi.',
      en: 'Marketplace ranking and competitor price tracking.',
    },
    accent: 'var(--c-amber)',
    Icon: IconShoppingCart,
    urlHint: 'Supplier ID (örn. 123456)',
    keyHint: 'API Key & Secret',
  },
  {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    blurb: {
      tr: 'Mağaza ID + API erişimi ile stok ve fiyat yönetimi.',
      en: 'Inventory and pricing via Merchant ID + API access.',
    },
    accent: 'var(--c-teal)',
    Icon: IconBuildingStore,
    urlHint: 'Merchant ID',
    keyHint: 'API Key',
  },
  {
    id: 'etsy',
    name: 'Etsy',
    blurb: {
      tr: 'Uluslararası satış için yorum ve sıralama analizi.',
      en: 'Reviews and ranking analysis for international sales.',
    },
    accent: 'var(--c-rose)',
    Icon: IconTag,
    urlHint: 'shop-name.etsy.com',
    keyHint: 'OAuth Personal Token',
  },
];

const STORAGE_KEY = 'kobi-kaptani.marketplaces';

export function SettingsClient({ locale }: { locale: string }) {
  const [conns, setConns] = useState<ConnectionMap>({});
  const [openForm, setOpenForm] = useState<MarketplaceDef['id'] | null>(null);
  const [helpFor, setHelpFor] = useState<PlatformWithGuide | null>(null);
  const isTr = locale === 'tr';

  // Load from localStorage on mount (demo persistence)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConns(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const save = (next: ConnectionMap) => {
    setConns(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const connect = (id: MarketplaceDef['id'], data: Connection) => {
    save({ ...conns, [id]: data });
    setOpenForm(null);
    notifications.show({
      color: 'green',
      title: isTr ? 'Bağlandı' : 'Connected',
      message: `${MARKETPLACES.find(m => m.id === id)?.name} → ${data.storeName}`,
      autoClose: 3500,
    });
  };

  const disconnect = (id: MarketplaceDef['id']) => {
    const next = { ...conns };
    delete next[id];
    save(next);
    notifications.show({
      color: 'gray',
      message: isTr ? 'Bağlantı kaldırıldı' : 'Disconnected',
      autoClose: 2500,
    });
  };

  const { mode, setMode } = useAppMode();
  const { hasAnyMarketplace } = useConnections();
  const [modePending, startModeTransition] = useTransition();

  const toggleMode = (checked: boolean) => {
    const next = checked ? 'real' : 'mock';
    if (next === 'real' && !hasAnyMarketplace) {
      notifications.show({
        color: 'red',
        message: isTr
          ? 'Önce en az bir mağaza bağla.'
          : 'Connect at least one store first.',
      });
      return;
    }
    startModeTransition(async () => {
      const result = await setAppMode(next);
      if ('error' in result) {
        notifications.show({ color: 'red', message: result.error });
        return;
      }
      setMode(next);
      notifications.show({
        color: 'green',
        message: isTr
          ? `Mod değişti: ${next === 'real' ? 'Gerçek' : 'Demo'}`
          : `Mode set to ${next === 'real' ? 'Real' : 'Demo'}`,
        autoClose: 2500,
      });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 920 }}>
      {/* Header */}
      <div>
        <span className="section-eyebrow">{isTr ? 'Ayarlar' : 'Settings'}</span>
        <h1
          className="landing-sans-display"
          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: 0 }}
        >
          {isTr ? 'Mağazalarını' : 'Connect your'}{' '}
          <em
            className="landing-display"
            style={{
              fontStyle: 'italic',
              fontWeight: 400,
              background:
                'linear-gradient(115deg, var(--c-emerald) 0%, var(--c-amber) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {isTr ? 'bağla.' : 'stores.'}
          </em>
        </h1>
        <p style={{ marginTop: 12, color: 'var(--fg-mute)', fontSize: 15, lineHeight: 1.55, maxWidth: 580 }}>
          {isTr
            ? 'Kaptan ve uzmanlar mağazalarındaki gerçek veriyi okuyup analiz edebilsin diye. Verin senin — istediğin zaman bağlantıyı kaldırabilirsin.'
            : 'So the Captain and specialists can read real data from your stores. Your data stays yours — disconnect any time.'}
        </p>
      </div>

      {/* Mode card */}
      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 20,
          background: 'var(--bg-elev)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <span
          style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'color-mix(in srgb, var(--c-emerald) 12%, transparent)',
            color: 'var(--c-emerald)', flexShrink: 0,
          }}
        >
          <IconMode size={18} stroke={2} />
        </span>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {isTr ? 'Çalışma Modu' : 'Working Mode'}
          </h3>
          <p style={{ margin: '4px 0 12px', fontSize: 13, color: 'var(--fg-mute)', lineHeight: 1.55 }}>
            {isTr
              ? 'Demo: örnek veri ile çalışır. Gerçek: en az bir mağaza bağlı olmalı.'
              : 'Demo: runs on seeded data. Real: requires at least one connected store.'}
          </p>
          <Switch
            checked={mode === 'real'}
            disabled={modePending}
            onChange={(e) => toggleMode(e.currentTarget.checked)}
            size="md"
            onLabel={isTr ? 'GERÇEK' : 'REAL'}
            offLabel={isTr ? 'DEMO' : 'DEMO'}
            label={
              <span style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>
                {mode === 'real'
                  ? (isTr ? 'Gerçek mod aktif' : 'Real mode active')
                  : (isTr ? 'Demo modu' : 'Demo mode')}
              </span>
            }
          />
        </div>
      </section>

      {/* Marketplace grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {MARKETPLACES.map((m) => {
          const conn = conns[m.id];
          const connected = !!conn;
          const isOpen = openForm === m.id;
          return (
            <article
              key={m.id}
              className="marketplace-card"
              style={connected ? { borderColor: 'color-mix(in srgb, var(--c-emerald) 35%, var(--border))' } : undefined}
            >
              <div className="marketplace-card-head">
                <span className="marketplace-icon" style={{ color: m.accent, borderColor: m.accent }}>
                  <m.Icon size={20} stroke={2} />
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
                    {m.name}
                  </h3>
                  {connected && (
                    <span className="marketplace-status">
                      <IconCheck size={11} stroke={3} /> {isTr ? 'Bağlı' : 'Connected'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={isTr ? 'Nasıl bağlanır?' : 'How to connect'}
                  title={isTr ? 'Nasıl bağlanır?' : 'How to connect'}
                  onClick={() => setHelpFor(m.id as PlatformWithGuide)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--fg-mute)',
                    width: 28, height: 28, borderRadius: 8,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <IconHelp size={14} stroke={2.2} />
                </button>
              </div>

              <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-mute)', margin: 0 }}>
                {m.blurb[isTr ? 'tr' : 'en']}
              </p>

              {connected && (
                <div className="marketplace-meta">
                  <div>
                    <span className="marketplace-meta-label">{isTr ? 'Mağaza' : 'Store'}</span>
                    <span className="marketplace-meta-value">{conn.storeName}</span>
                  </div>
                  <div>
                    <span className="marketplace-meta-label">URL</span>
                    <span className="marketplace-meta-value" title={conn.url}>{conn.url}</span>
                  </div>
                </div>
              )}

              {isOpen && (
                <ConnectForm
                  marketplace={m}
                  locale={locale}
                  onCancel={() => setOpenForm(null)}
                  onSubmit={(data) => connect(m.id, data)}
                />
              )}

              {!isOpen && (
                <div className="marketplace-actions">
                  {connected ? (
                    <>
                      <a
                        href={conn.url.startsWith('http') ? conn.url : `https://${conn.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary btn-small"
                      >
                        {isTr ? 'Mağazayı Aç' : 'Open Store'}
                        <IconExternalLink size={13} stroke={2.4} />
                      </a>
                      <button
                        type="button"
                        className="btn-ghost btn-small"
                        onClick={() => disconnect(m.id)}
                      >
                        <IconX size={13} stroke={2.4} />
                        {isTr ? 'Bağlantıyı Kaldır' : 'Disconnect'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary btn-small"
                      onClick={() => setOpenForm(m.id)}
                    >
                      {isTr ? 'Bağla' : 'Connect'}
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--fg-dim)', maxWidth: 600 }}>
        {isTr
          ? 'API anahtarları sadece bu cihazda saklanır (demo modu). Üretim sürümünde Supabase Vault üzerinden şifrelenmiş olarak tutulacaktır.'
          : 'API keys are stored on this device only (demo mode). In production they will be encrypted via Supabase Vault.'}
      </p>
      {helpFor && (
        <ConnectHelpModal
          platform={helpFor}
          opened={helpFor !== null}
          onClose={() => setHelpFor(null)}
          locale={locale}
        />
      )}
    </div>
  );
}

function ConnectForm({
  marketplace,
  locale,
  onCancel,
  onSubmit,
}: {
  marketplace: MarketplaceDef;
  locale: string;
  onCancel: () => void;
  onSubmit: (data: Connection) => void;
}) {
  const isTr = locale === 'tr';
  const [storeName, setStoreName] = useState('');
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !url || !key) return;
    onSubmit({
      storeName,
      url,
      key,
      connectedAt: new Date().toISOString(),
    });
  };

  return (
    <form className="marketplace-form" onSubmit={submit}>
      <div>
        <label>{isTr ? 'Mağaza Adı' : 'Store Name'}</label>
        <input
          type="text"
          required
          className="auth-input"
          placeholder={isTr ? 'örn. Ayşe Seramik Atölyesi' : 'e.g. Ayşe Ceramics'}
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />
      </div>
      <div>
        <label>{isTr ? 'Mağaza URL / ID' : 'Store URL / ID'}</label>
        <input
          type="text"
          required
          className="auth-input"
          placeholder={marketplace.urlHint}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div>
        <label>{isTr ? 'API Anahtarı' : 'API Key'}</label>
        <input
          type="password"
          required
          className="auth-input"
          placeholder={marketplace.keyHint}
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button type="submit" className="btn-primary btn-small">
          {isTr ? 'Doğrula & Bağla' : 'Verify & Connect'}
        </button>
        <button type="button" className="btn-ghost btn-small" onClick={onCancel}>
          {isTr ? 'İptal' : 'Cancel'}
        </button>
      </div>
    </form>
  );
}
