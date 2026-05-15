import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface BriefItem {
  status: 'ok' | 'warn' | 'critical' | 'info';
  text: string;
}

export function BriefCard({
  locale,
  items,
}: {
  locale: string;
  items: BriefItem[];
}) {
  const iconMap = { ok: '✓', warn: '⚠', critical: '🔴', info: 'ℹ' };
  const colorMap = {
    ok: 'text-emerald-500',
    warn: 'text-yellow-500',
    critical: 'text-red-500',
    info: 'text-blue-500',
  };

  return (
    <Card className="border-emerald-500/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Günün Brief'i</h2>
          <Badge variant="outline">5 ajan</Badge>
        </div>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={colorMap[item.status]}>{iconMap[item.status]}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-6">
          <Button asChild>
            <Link href={`/${locale}/dashboard/chat`}>Kaptanla Konuş →</Link>
          </Button>
          <Button variant="outline">Detayları Gör</Button>
        </div>
      </CardContent>
    </Card>
  );
}
