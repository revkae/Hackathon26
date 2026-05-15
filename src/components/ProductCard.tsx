import { Card, Text, Badge, Group, Image } from '@mantine/core';

interface ProductCardProps {
  name: string;
  price: number | null;
  category: string | null;
  channels: string[];
  imageUrl?: string;
}

export function ProductCard({ name, price, category, channels, imageUrl }: ProductCardProps) {
  return (
    <Card>
      <Card.Section>
        {imageUrl ? (
          <Image src={imageUrl} alt={name} h={180} fit="cover" />
        ) : (
          <div
            style={{
              height: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              background: 'var(--mantine-color-default-hover)',
            }}
          >
            🏺
          </div>
        )}
      </Card.Section>
      <Text fw={500} mt="sm" lineClamp={2}>{name}</Text>
      <Group justify="space-between" mt="xs">
        <Text fw={700} c="teal">{price ? `₺${price.toFixed(2)}` : '—'}</Text>
        {category && <Badge variant="outline">{category}</Badge>}
      </Group>
      <Group gap={4} mt="xs">
        {channels.map(ch => (
          <Badge key={ch} variant="light" size="sm">{ch}</Badge>
        ))}
      </Group>
    </Card>
  );
}
