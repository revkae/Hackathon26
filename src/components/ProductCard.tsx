'use client';
import { Card, Text, Badge, Group, Image, Center } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';

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
          <Center h={180} bg="var(--mantine-color-default-hover)">
            <IconPhoto size={40} color="var(--mantine-color-dimmed)" stroke={1.5} />
          </Center>
        )}
      </Card.Section>
      <Text fw={500} mt="sm" lineClamp={2}>{name}</Text>
      <Group justify="space-between" mt="xs">
        <Text fw={700} c="shopifyGreen">{price ? `₺${price.toFixed(2)}` : '—'}</Text>
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
