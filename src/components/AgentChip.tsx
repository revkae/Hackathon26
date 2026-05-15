import { Badge } from '@mantine/core';

const config: Record<string, { color: string; icon: string; label: string }> = {
  captain:   { color: 'teal',   icon: '⚓', label: 'Kaptan' },
  seo:       { color: 'blue',   icon: '🔍', label: 'SEO' },
  marketing: { color: 'pink',   icon: '📢', label: 'Pazarlama' },
  pricing:   { color: 'orange', icon: '💰', label: 'Fiyat' },
  reviews:   { color: 'grape',  icon: '💬', label: 'Yorum' },
  cashflow:  { color: 'yellow', icon: '📊', label: 'Nakit' },
};

export function AgentChip({ agent }: { agent: string }) {
  const c = config[agent] ?? { color: 'gray', icon: '🤖', label: agent };
  return (
    <Badge color={c.color} variant="light" size="md">
      {c.icon} {c.label}
    </Badge>
  );
}
