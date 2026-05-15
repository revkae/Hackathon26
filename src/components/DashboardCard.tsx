import { Card, CardContent } from '@/components/ui/card';

export function DashboardCard({
  label, value, hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-3xl font-bold mt-1">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
      </CardContent>
    </Card>
  );
}
