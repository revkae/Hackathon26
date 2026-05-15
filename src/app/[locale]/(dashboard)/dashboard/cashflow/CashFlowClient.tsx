'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { CashFlowChart } from '@/components/CashFlowChart';
import { Card, Button, Stack, Title, Group, Text } from '@mantine/core';
import type { CashFlowForecast } from '@/agents/schemas';

type Scenario = 'current' | 'discount15' | 'campaign';

export function CashFlowClient({
  initial, locale,
}: {
  initial: CashFlowForecast;
  locale: string;
}) {
  const t = useTranslations('cashflow');
  const [data, setData] = useState(initial);
  const [scenario, setScenario] = useState<Scenario>('current');
  const [pending, startTransition] = useTransition();

  function switchScenario(next: Scenario) {
    if (next === scenario) return;
    setScenario(next);
    startTransition(async () => {
      const res = await fetch('/api/cashflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: next, locale }),
      });
      const result = await res.json();
      setData(result);
    });
  }

  const scenarioLabels: Record<Scenario, 'scenarioCurrent' | 'scenarioDiscount' | 'scenarioCampaign'> = {
    current: 'scenarioCurrent',
    discount15: 'scenarioDiscount',
    campaign: 'scenarioCampaign',
  };

  return (
    <Stack gap="lg">
      <Title order={1}>📊 {t('title')}</Title>

      <CashFlowChart data={data.projection} riskScore={data.riskScore as 'green' | 'yellow' | 'red'} />

      <Card>
        <Text fw={500} mb="sm">Senaryolar</Text>
        <Button.Group>
          {(['current', 'discount15', 'campaign'] as Scenario[]).map(s => (
            <Button
              key={s}
              variant={scenario === s ? 'filled' : 'default'}
              size="sm"
              onClick={() => switchScenario(s)}
              disabled={pending}
            >
              {t(scenarioLabels[s])}
            </Button>
          ))}
        </Button.Group>
      </Card>

      <Card>
        <Group align="flex-start" gap="sm">
          <Text fz="xl">
            {data.riskScore === 'red' ? '🔴' : data.riskScore === 'yellow' ? '⚠️' : '🟢'}
          </Text>
          <Stack gap="xs" style={{ flex: 1 }}>
            <p className="whitespace-pre-wrap" style={{ margin: 0, fontSize: 'var(--mantine-font-size-sm)' }}>
              {data.commentary}
            </p>
            {data.suggestedAction && (
              <Text size="sm" fw={500} c="shopifyGreen">
                → {data.suggestedAction}
              </Text>
            )}
          </Stack>
        </Group>
      </Card>
    </Stack>
  );
}
