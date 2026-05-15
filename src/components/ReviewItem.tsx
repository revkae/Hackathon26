import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface ReviewItemProps {
  rating: number;
  body: string;
  language?: string | null;
  channel: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  postedAt?: string | null;
}

export function ReviewItem({ rating, body, language, channel, sentiment, postedAt }: ReviewItemProps) {
  const sentimentColor =
    sentiment === 'positive' ? 'text-emerald-500' :
    sentiment === 'negative' ? 'text-red-500' :
    'text-muted-foreground';

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-4 ${i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            {language && <Badge variant="outline" className="text-xs">{language.toUpperCase()}</Badge>}
            <Badge variant="secondary" className="text-xs">{channel}</Badge>
          </div>
        </div>
        <p className={`text-sm ${sentimentColor}`}>{body}</p>
        {postedAt && (
          <p className="text-xs text-muted-foreground">{new Date(postedAt).toLocaleDateString()}</p>
        )}
      </CardContent>
    </Card>
  );
}
