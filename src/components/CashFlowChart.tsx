'use client';
import { AreaChart } from '@mantine/charts';
import { Card } from '@mantine/core';

interface CashFlowChartProps {
  data: { date: string; balance: number }[];
  riskScore: 'green' | 'yellow' | 'red';
}

export function CashFlowChart({ data, riskScore }: CashFlowChartProps) {
  const color =
    riskScore === 'red'
      ? 'red.6'
      : riskScore === 'yellow'
      ? 'yellow.6'
      : 'shopifyGreen.6';

  return (
    <Card>
      <AreaChart
        h={300}
        data={data}
        dataKey="date"
        series={[{ name: 'balance', label: 'Bakiye', color }]}
        curveType="monotone"
        withGradient
        gridAxis="xy"
        valueFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
        referenceLines={[{ y: 0, color: 'red.6', label: 'Sıfır' }]}
        tickLine="xy"
      />
    </Card>
  );
}
