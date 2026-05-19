'use client';

import { Modal } from '@mantine/core';
import { useState } from 'react';
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
} from '@tabler/icons-react';
import {
  GUIDES,
  type PlatformWithGuide,
} from '@/lib/connect-guides';

export function ConnectHelpModal({
  platform,
  opened,
  onClose,
  locale,
}: {
  platform: PlatformWithGuide;
  opened: boolean;
  onClose: () => void;
  locale: string;
}) {
  const isTr = locale === 'tr';
  const guide = GUIDES[platform];
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied((c) => (c === idx ? null : c)), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      withCloseButton
      overlayProps={{ color: '#06120E', backgroundOpacity: 0.72, blur: 6 }}
      classNames={{
        content: 'connect-modal',
        header: 'connect-modal-header',
        body: 'connect-modal-body',
        close: 'connect-modal-close',
      }}
      title={
        <div>
          <span
            className="section-eyebrow"
            style={{ display: 'block', margin: '0 0 3px' }}
          >
            {isTr ? 'Bağlantı Kılavuzu' : 'Connection Guide'}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--fg)',
            }}
          >
            {isTr ? guide.title.tr : guide.title.en}
          </span>
        </div>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--fg-mute)', margin: '0 0 20px' }}>
        {isTr ? guide.blurb.tr : guide.blurb.en}
      </p>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {guide.steps.map((step, idx) => {
          const text = isTr ? step.tr : step.en;
          return (
            <li key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 26, height: 26, borderRadius: 999,
                  background: 'color-mix(in srgb, var(--c-emerald) 14%, transparent)',
                  color: 'var(--c-emerald)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  border: '1px solid var(--border)',
                }}
              >
                {idx + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--fg)' }}>{text}</p>

                {step.copySnippet && (
                  <button
                    type="button"
                    onClick={() => copy(step.copySnippet!, idx)}
                    className="social-mini-btn"
                    style={{ marginTop: 8 }}
                  >
                    {copied === idx ? <IconCheck size={12} stroke={2.4} /> : <IconCopy size={12} stroke={2.2} />}
                    <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>{step.copySnippet}</code>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a
          href={guide.adminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary btn-small"
        >
          {isTr ? 'Yönetici Panelini Aç' : 'Open Admin Panel'}
          <IconExternalLink size={13} stroke={2.4} />
        </a>
        <button type="button" className="btn-ghost btn-small" onClick={onClose}>
          {isTr ? 'Kapat' : 'Close'}
        </button>
      </div>
    </Modal>
  );
}
