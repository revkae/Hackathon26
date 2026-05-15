import { Card, Skeleton, Stack } from '@mantine/core';

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <Stack gap="sm">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height={16} radius="sm" />
        ))}
      </Stack>
    </Card>
  );
}
