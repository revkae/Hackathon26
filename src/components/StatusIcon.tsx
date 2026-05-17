import {
  IconCircleCheckFilled,
  IconAlertTriangleFilled,
  IconAlertOctagonFilled,
  IconInfoCircleFilled,
} from '@tabler/icons-react';

type IconComponent = React.ComponentType<{ size?: number | string; color?: string }>;

const MAP: Record<string, { Icon: IconComponent; color: string }> = {
  ok: { Icon: IconCircleCheckFilled, color: 'teal' },
  warn: { Icon: IconAlertTriangleFilled, color: 'yellow' },
  critical: { Icon: IconAlertOctagonFilled, color: 'red' },
  info: { Icon: IconInfoCircleFilled, color: 'blue' },
};

export function StatusIcon({ status, size = 18 }: { status: string; size?: number }) {
  const { Icon, color } = MAP[status] ?? MAP.info;
  return <Icon size={size} color={`var(--mantine-color-${color}-6)`} />;
}
