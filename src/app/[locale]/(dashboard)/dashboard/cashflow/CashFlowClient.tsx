'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { CashFlowChart } from '@/components/CashFlowChart';
import { Card, Button, Stack, Title, Group, Text, ThemeIcon, Skeleton } from '@mantine/core';
import { IconChartArea, IconCircleCheck, IconAlertTriangle, IconAlertOctagon } from '@tabler/icons-react';
import type { CashFlowForecast } from '@/agents/schemas';

type Scenario = 'current' | 'discount15' | 'campaign';

const RISK = {
  green: { color: 'teal', Icon: IconCircleCheck },
  yellow: { color: 'yellow', Icon: IconAlertTriangle },
  red: { color: 'red', Icon: IconAlertOctagon },
} as const;

export function CashFlowClient({
  initial, locale,
}: {
  initial: CashFlowForecast;
  locale: string;
}) {
  const t = useTranslations('cashflow');
  const [data, setData] = useState(initial);
  const [scenario, setScenario] = useState<Scenario>('current');
  const [chartLoading, setChartLoading] = useState(false);
  const [commentaryLoading, setCommentaryLoading] = useState(!initial.commentary);
  const latest = useRef<Scenario>('current');

  function post(body: object): Promise<CashFlowForecast> {
    return fetch('/api/cashflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json());
  }

  // SSR gave us the chart instantly but no commentary — fetch it on mount.
  useEffect(() => {
    if (initial.commentary) return;
    let cancelled = false;
    post({ scenario: 'current', locale, withCommentary: true }).then(full => {
      if (!cancelled && latest.current === 'current') {
        setData(full);
        setCommentaryLoading(false);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchScenario(next: Scenario) {
    if (next === scenario) return;
    setScenario(next);
    latest.current = next;
    setChartLoading(true);
    setCommentaryLoading(true);

    // 1. Fast: deterministic projection updates the chart immediately.
    const base = await post({ scenario: next, withCommentary: false });
    if (latest.current === next) {
      setData(base);
      setChartLoading(false);
    }

    // 2. Slow: Gemini commentary catches up.
    const full = await post({ scenario: next, locale, withCommentary: true });
    if (latest.current === next) {
      setData(full);
      setCommentaryLoading(false);
    }
  }

  const scenarioLabels: Record<Scenario, 'scenarioCurrent' | 'scenarioDiscount' | 'scenarioCampaign'> = {
    current: 'scenarioCurrent',
    discount15: 'scenarioDiscount',
    campaign: 'scenarioCampaign',
  };

  const risk = RISK[data.riskScore as 'green' | 'yellow' | 'red'] ?? RISK.green;
  const RiskIcon = risk.Icon;

  return (
    <Stack gap="lg">
      <Group gap="sm">
        <ThemeIcon variant="light" size="lg" radius="md">
          <IconChartArea size={20} />
        </ThemeIcon>
        <Title order={1}>{t('title')}</Title>
      </Group>

      <CashFlowChart
        data={data.projection}
        riskScore={data.riskScore as 'green' | 'yellow' | 'red'}
        loading={chartLoading}
      />

      <Card>
        <Text fw={500} mb="sm">{locale === 'tr' ? 'Senaryolar' : 'Scenarios'}</Text>
        <Button.Group>
          {(['current', 'discount15', 'campaign'] as Scenario[]).map(s => (
            <Button
              key={s}
              variant={scenario === s ? 'filled' : 'default'}
              size="sm"
              onClick={() => switchScenario(s)}
              disabled={chartLoading}
            >
              {t(scenarioLabels[s])}
            </Button>
          ))}
        </Button.Group>
      </Card>

      <Card>
        <Group align="flex-start" gap="sm" wrap="nowrap">
          <ThemeIcon color={risk.color} variant="light" size="lg" radius="xl">
            <RiskIcon size={20} />
          </ThemeIcon>
          <Stack gap="xs" style={{ flex: 1 }}>
            {commentaryLoading ? (
              <>
                <Skeleton height={9} width="92%" radius="sm" />
                <Skeleton height={9} width="84%" radius="sm" />
                <Skeleton height={9} width="60%" radius="sm" />
                <Text size="xs" c="dimmed" mt={4}>
                  {locale === 'tr' ? 'Kaptan yorumu hazırlanıyor…' : 'Captain is preparing commentary…'}
                </Text>
              </>
            ) : (
              <>
                <p className="whitespace-pre-wrap" style={{ margin: 0, fontSize: 'var(--mantine-font-size-sm)' }}>
                  {data.commentary}
                </p>
                {data.suggestedAction && (
                  <Text size="sm" fw={500} c="shopifyGreen">
                    → {data.suggestedAction}
                  </Text>
                )}
              </>
            )}
          </Stack>
        </Group>
      </Card>
    </Stack>
  );
}
