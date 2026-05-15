import { Timeline, Text } from '@mantine/core';
import { AgentChip } from './AgentChip';
import type { TraceStep } from '@/agents/schemas';

export function AgentTimeline({ steps }: { steps: TraceStep[] }) {
  return (
    <Timeline active={steps.length} bulletSize={20} lineWidth={2}>
      {steps.map((step, i) => (
        <Timeline.Item key={i} title={<AgentChip agent={step.agent} />}>
          <Text size="sm">{step.action}</Text>
          {step.calledBy && (
            <Text size="xs" c="dimmed">← {step.calledBy}</Text>
          )}
          <Text size="xs" c="dimmed">
            {new Date(step.timestamp).toLocaleTimeString('tr-TR')}
            {step.durationMs ? ` • ${step.durationMs}ms` : ''}
          </Text>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
