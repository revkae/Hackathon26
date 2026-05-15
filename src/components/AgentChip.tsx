import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
  captain: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  seo: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  marketing: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
  pricing: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  reviews: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  cashflow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
};

const icons: Record<string, string> = {
  captain: '⚓',
  seo: '🔍',
  marketing: '📢',
  pricing: '💰',
  reviews: '💬',
  cashflow: '📊',
};

const labels: Record<string, string> = {
  captain: 'Kaptan',
  seo: 'SEO',
  marketing: 'Pazarlama',
  pricing: 'Fiyat',
  reviews: 'Yorum',
  cashflow: 'Nakit',
};

export function AgentChip({ agent }: { agent: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1', styles[agent] ?? '')}>
      <span>{icons[agent]}</span>
      <span>{labels[agent]}</span>
    </Badge>
  );
}
