import { AgentChip } from './AgentChip';
import type { TraceStep } from '@/agents/schemas';

export function AgentTimeline({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="font-mono text-sm space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="text-muted-foreground text-xs w-20 tabular-nums">
            {new Date(step.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <AgentChip agent={step.agent} />
          <div className="flex-1">
            <span className="text-sm">{step.action}</span>
            {step.calledBy && (
              <span className="text-xs text-muted-foreground ml-2">
                ← {step.calledBy}
              </span>
            )}
          </div>
          {step.durationMs && (
            <span className="text-xs text-muted-foreground">
              {step.durationMs}ms
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
