import { Badge } from '@mantine/core';
import {
  IconAnchor,
  IconSearch,
  IconSpeakerphone,
  IconCoin,
  IconMessageCircle,
  IconChartBar,
  IconRobot,
} from '@tabler/icons-react';

type IconComponent = React.ComponentType<{ size?: number | string }>;

const config: Record<string, { color: string; Icon: IconComponent; label: string }> = {
  captain: { color: 'teal', Icon: IconAnchor, label: 'Kaptan' },
  seo: { color: 'blue', Icon: IconSearch, label: 'SEO' },
  marketing: { color: 'pink', Icon: IconSpeakerphone, label: 'Pazarlama' },
  pricing: { color: 'orange', Icon: IconCoin, label: 'Fiyat' },
  reviews: { color: 'grape', Icon: IconMessageCircle, label: 'Yorum' },
  cashflow: { color: 'yellow', Icon: IconChartBar, label: 'Nakit' },
};

export function AgentChip({ agent }: { agent: string }) {
  const c = config[agent] ?? { color: 'gray', Icon: IconRobot, label: agent };
  const { Icon } = c;
  return (
    <Badge color={c.color} variant="light" size="md" leftSection={<Icon size={12} />}>
      {c.label}
    </Badge>
  );
}
