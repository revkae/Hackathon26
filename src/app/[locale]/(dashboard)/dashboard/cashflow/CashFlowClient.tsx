'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { CashFlowChart } from '@/components/CashFlowChart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📊 {t('title')}</h1>

      <CashFlowChart data={data.projection} riskScore={data.riskScore as 'green' | 'yellow' | 'red'} />

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3">Senaryolar</h3>
          <div className="flex gap-2">
            {(['current', 'discount15', 'campaign'] as Scenario[]).map(s => (
              <Button
                key={s}
                variant={scenario === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchScenario(s)}
                disabled={pending}
              >
                {t(scenarioLabels[s])}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{data.riskScore === 'red' ? '🔴' : data.riskScore === 'yellow' ? '⚠️' : '🟢'}</span>
            <div className="flex-1">
              <p className="text-sm whitespace-pre-wrap">{data.commentary}</p>
              {data.suggestedAction && (
                <p className="text-sm mt-2 font-medium text-emerald-500">→ {data.suggestedAction}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
