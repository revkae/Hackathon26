'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface CashFlowChartProps {
  data: { date: string; balance: number }[];
  riskScore: 'green' | 'yellow' | 'red';
}

export function CashFlowChart({ data, riskScore }: CashFlowChartProps) {
  const color = riskScore === 'red' ? '#ef4444' : riskScore === 'yellow' ? '#eab308' : '#10b981';

  return (
    <Card>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
            <YAxis tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => [`₺${value.toFixed(0)}`, 'Bakiye']}
              labelFormatter={(date) => date}
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="balance" stroke={color} fill="url(#cashGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
