import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  name: string;
  price: number | null;
  category: string | null;
  channels: string[];
  imageUrl?: string;
}

export function ProductCard({ name, price, category, channels, imageUrl }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      {imageUrl ? (
        <div className="aspect-square bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-square bg-muted flex items-center justify-center text-4xl">
          🏺
        </div>
      )}
      <CardContent className="pt-4 space-y-2">
        <h3 className="font-medium line-clamp-2">{name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-emerald-500 font-bold">
            {price ? `₺${price.toFixed(2)}` : '—'}
          </span>
          {category && <Badge variant="outline" className="text-xs">{category}</Badge>}
        </div>
        <div className="flex gap-1 flex-wrap">
          {channels.map(ch => (
            <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
