'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import {
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconPlus,
} from '@tabler/icons-react';
import { Menu } from '@mantine/core';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

function timeAgo(iso: string, isTr: boolean): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1)   return isTr ? 'şimdi' : 'now';
  if (m < 60)  return isTr ? `${m} dk önce` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return isTr ? `${h} saat önce` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return isTr ? `${d} gün önce` : `${d}d ago`;
}

export function ChatList({ activeId }: { activeId?: string }) {
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'tr';
  const isTr = locale === 'tr';
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const refresh = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) return;
      const json = (await res.json()) as { conversations: Conversation[] };
      setConversations(json.conversations);
    } catch {
      /* ignore */
    }
  };

  // Re-fetch whenever the active conversation changes (likely a new one was created
  // by /api/agent or the URL moved).
  useEffect(() => {
    refresh();
  }, [pathname]);

  const commitRename = async (id: string) => {
    const title = renameValue.trim();
    if (!title) { setRenamingId(null); return; }
    setConversations(c => c?.map(x => x.id === id ? { ...x, title } : x) ?? null);
    setRenamingId(null);
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      notifications.show({ color: 'red', message: isTr ? 'Yeniden adlandırma başarısız' : 'Rename failed' });
      refresh();
    }
  };

  const removeConversation = async (id: string) => {
    if (!confirm(isTr ? 'Bu sohbeti silmek istediğinden emin misin?' : 'Delete this conversation?')) return;
    setConversations(c => c?.filter(x => x.id !== id) ?? null);
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      notifications.show({ color: 'red', message: isTr ? 'Silinemedi' : 'Delete failed' });
      refresh();
      return;
    }
    if (id === activeId) {
      router.push(`/${locale}/dashboard/chat`);
    }
  };

  return (
    <aside
      style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: 12,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <Link
        href={`/${locale}/dashboard/chat`}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 10,
          color: 'var(--fg)', textDecoration: 'none',
          fontSize: 13.5, fontWeight: 500,
          border: '1px dashed var(--border)',
          marginBottom: 8,
        }}
      >
        <IconPlus size={14} stroke={2.4} />
        {isTr ? 'Yeni sohbet' : 'New chat'}
      </Link>

      {conversations === null && (
        <p style={{ fontSize: 12.5, color: 'var(--fg-dim)', padding: '8px 12px' }}>
          {isTr ? 'Yükleniyor…' : 'Loading…'}
        </p>
      )}

      {conversations?.length === 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--fg-dim)', padding: '8px 12px' }}>
          {isTr ? 'Henüz sohbet yok.' : 'No conversations yet.'}
        </p>
      )}

      {conversations?.map((c) => {
        const isActive = c.id === activeId;
        if (renamingId === c.id) {
          return (
            <form
              key={c.id}
              onSubmit={(e) => { e.preventDefault(); commitRename(c.id); }}
              style={{ padding: '6px 8px' }}
            >
              <input
                autoFocus
                className="auth-input"
                style={{ fontSize: 13, padding: '6px 8px' }}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(c.id)}
              />
            </form>
          );
        }
        return (
          <div
            key={c.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 4px 6px 12px',
              borderRadius: 10,
              background: isActive ? 'color-mix(in srgb, var(--c-emerald) 8%, transparent)' : 'transparent',
              border: isActive ? '1px solid color-mix(in srgb, var(--c-emerald) 30%, var(--border))' : '1px solid transparent',
            }}
          >
            <Link
              href={`/${locale}/dashboard/chat/${c.id}`}
              style={{
                flex: 1, minWidth: 0,
                color: 'var(--fg)', textDecoration: 'none',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 13, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
                title={c.title}
              >
                {c.title}
              </span>
              <span style={{ fontSize: 11, color: 'var(--fg-dim)' }}>
                {timeAgo(c.updated_at, isTr)}
              </span>
            </Link>
            <Menu shadow="md" position="bottom-end" withinPortal>
              <Menu.Target>
                <button
                  type="button"
                  aria-label={isTr ? 'Seçenekler' : 'Options'}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--fg-mute)',
                    width: 24, height: 24, borderRadius: 6,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <IconDotsVertical size={14} stroke={2} />
                </button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconPencil size={13} />}
                  onClick={() => { setRenamingId(c.id); setRenameValue(c.title); }}
                >
                  {isTr ? 'Yeniden adlandır' : 'Rename'}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrash size={13} />}
                  color="red"
                  onClick={() => removeConversation(c.id)}
                >
                  {isTr ? 'Sil' : 'Delete'}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        );
      })}
    </aside>
  );
}
