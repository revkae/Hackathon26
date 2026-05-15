import { Card, Text } from '@mantine/core';

export function DashboardCard({
  label, value, hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="1.75rem" fw={700} mt={4}>{value}</Text>
      {hint && <Text size="xs" c="dimmed" mt={8}>{hint}</Text>}
    </Card>
  );
}
