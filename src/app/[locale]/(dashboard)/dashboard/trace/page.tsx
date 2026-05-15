import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function TracePage() {
  const supabase = await createClient();
  const { data: traces } = await supabase
    .from('agent_traces')
    .select('id, query, trace_json, duration_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🔬 Agent Trace</h1>
      {(traces ?? []).length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              Henüz ajan çalışması yok. Kaptan sekmesinde bir soru sor, sonra buraya dön.
            </p>
          </CardContent>
        </Card>
      )}
      {(traces ?? []).map(trace => (
        <Card key={trace.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground italic">"{trace.query}"</div>
              <div className="text-xs text-muted-foreground">
                {trace.duration_ms}ms • {new Date(trace.created_at).toLocaleString('tr-TR')}
              </div>
            </div>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-80">
              {JSON.stringify(trace.trace_json, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
