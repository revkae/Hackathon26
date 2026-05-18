'use client';

import { IconAnchor, IconSearch, IconSpeakerphone, IconCoin, IconMessageCircle, IconChartBar } from '@tabler/icons-react';

interface NodeSpec {
  id: 'seo' | 'marketing' | 'pricing' | 'reviews' | 'cashflow';
  label: string;
  labelEn: string;
  x: number;
  y: number;
  color: string;
}

/**
 * SVG mini-graph showing Captain ⇆ 5 specialists with animated traffic.
 * Lives in the chat page's right pane, replaces the old skeleton list.
 */
export function A2AGraph({ locale = 'tr' }: { locale?: string }) {
  const center = { x: 160, y: 145 };
  const captainR = 28;

  const nodes: NodeSpec[] = [
    { id: 'seo',       label: 'SEO',      labelEn: 'SEO',        x: 160, y: 40,  color: 'var(--c-teal)' },
    { id: 'marketing', label: 'Pazarlama',labelEn: 'Marketing',  x: 264, y: 110, color: 'var(--c-amber)' },
    { id: 'pricing',   label: 'Fiyat',    labelEn: 'Pricing',    x: 226, y: 230, color: 'var(--c-emerald)' },
    { id: 'reviews',   label: 'Yorum',    labelEn: 'Reviews',    x: 94,  y: 230, color: 'var(--c-rose)' },
    { id: 'cashflow',  label: 'Nakit',    labelEn: 'Cash flow',  x: 56,  y: 110, color: 'var(--c-lime)' },
  ];

  // A2A cross edges (subset — the interesting ones for storytelling)
  const a2aEdges: Array<[NodeSpec['id'], NodeSpec['id']]> = [
    ['seo', 'pricing'],
    ['reviews', 'marketing'],
  ];

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n])) as Record<NodeSpec['id'], NodeSpec>;

  return (
    <div className="a2a-graph-wrap">
      <svg
        viewBox="0 0 320 280"
        className="a2a-graph"
        role="img"
        aria-label="Agent-to-agent communication graph"
      >
        <defs>
          <filter id="a2a-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="captain-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--c-emerald)" stopOpacity="0.85" />
          </radialGradient>
        </defs>

        {/* Captain → Specialist edges (drawn behind nodes) */}
        {nodes.map((n, i) => {
          const dx = n.x - center.x;
          const dy = n.y - center.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const sx = center.x + (dx / len) * captainR;
          const sy = center.y + (dy / len) * captainR;
          const ex = n.x - (dx / len) * 18;
          const ey = n.y - (dy / len) * 18;
          return (
            <g key={`edge-${n.id}`}>
              <line
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                stroke="var(--border-strong)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {/* Animated packet */}
              <circle
                r={2.5}
                fill={n.color}
                style={{ filter: 'url(#a2a-glow)' }}
              >
                <animate
                  attributeName="cx"
                  values={`${sx};${ex};${sx}`}
                  dur="3.6s"
                  repeatCount="indefinite"
                  begin={`${i * 0.45}s`}
                />
                <animate
                  attributeName="cy"
                  values={`${sy};${ey};${sy}`}
                  dur="3.6s"
                  repeatCount="indefinite"
                  begin={`${i * 0.45}s`}
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="3.6s"
                  repeatCount="indefinite"
                  begin={`${i * 0.45}s`}
                />
              </circle>
            </g>
          );
        })}

        {/* A2A cross edges */}
        {a2aEdges.map(([a, b], i) => {
          const na = nodeMap[a];
          const nb = nodeMap[b];
          const dx = nb.x - na.x;
          const dy = nb.y - na.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const sx = na.x + (dx / len) * 18;
          const sy = na.y + (dy / len) * 18;
          const ex = nb.x - (dx / len) * 18;
          const ey = nb.y - (dy / len) * 18;
          // Curved path to avoid running over captain
          const mx = (sx + ex) / 2;
          const my = (sy + ey) / 2;
          // Push midpoint away from center
          const cdx = mx - center.x;
          const cdy = my - center.y;
          const clen = Math.sqrt(cdx * cdx + cdy * cdy);
          const cx = mx + (cdx / clen) * 22;
          const cy = my + (cdy / clen) * 22;
          const pathId = `a2a-path-${i}`;
          const d = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
          return (
            <g key={`a2a-${i}`}>
              <path
                id={pathId}
                d={d}
                fill="none"
                stroke="var(--c-amber)"
                strokeWidth={1}
                strokeDasharray="2 4"
                strokeOpacity={0.45}
              />
              <circle r={2.3} fill="var(--c-amber)" style={{ filter: 'url(#a2a-glow)' }}>
                <animateMotion dur="4.2s" repeatCount="indefinite" begin={`${i * 1.3 + 0.6}s`}>
                  <mpath href={`#${pathId}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="4.2s"
                  repeatCount="indefinite"
                  begin={`${i * 1.3 + 0.6}s`}
                />
              </circle>
            </g>
          );
        })}

        {/* Captain (center) */}
        <g>
          <circle
            cx={center.x}
            cy={center.y}
            r={captainR + 6}
            fill="none"
            stroke="var(--c-emerald)"
            strokeOpacity={0.25}
            strokeWidth={1.5}
          >
            <animate
              attributeName="r"
              values={`${captainR + 4};${captainR + 12};${captainR + 4}`}
              dur="2.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.35;0.05;0.35"
              dur="2.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={center.x} cy={center.y} r={captainR} fill="url(#captain-fill)" />
          <foreignObject x={center.x - 13} y={center.y - 13} width={26} height={26}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 26,
                color: 'var(--bg-deep)',
              }}
            >
              <IconAnchor size={18} stroke={2.4} />
            </div>
          </foreignObject>
        </g>

        {/* Specialists */}
        {nodes.map((n) => (
          <g key={`node-${n.id}`}>
            <circle
              cx={n.x}
              cy={n.y}
              r={18}
              fill="var(--bg-elev)"
              stroke={n.color}
              strokeWidth={1.5}
            />
            <foreignObject x={n.x - 11} y={n.y - 11} width={22} height={22}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  color: n.color,
                }}
              >
                <AgentIcon id={n.id} />
              </div>
            </foreignObject>
          </g>
        ))}

        {/* Labels */}
        {nodes.map((n) => (
          <text
            key={`lbl-${n.id}`}
            x={n.x}
            y={n.y + 32}
            textAnchor="middle"
            fontSize="10"
            fontFamily="Geist, system-ui, sans-serif"
            fontWeight={500}
            fill="var(--fg-mute)"
          >
            {locale === 'tr' ? n.label : n.labelEn}
          </text>
        ))}
      </svg>

      <div className="a2a-graph-legend">
        <span className="a2a-legend-item">
          <span className="a2a-legend-dot" style={{ background: 'var(--c-emerald)' }} />
          {locale === 'tr' ? 'Kaptan → Uzman' : 'Captain → Specialist'}
        </span>
        <span className="a2a-legend-item">
          <span className="a2a-legend-dot" style={{ background: 'var(--c-amber)' }} />
          {locale === 'tr' ? 'Uzman ↔ Uzman (A2A)' : 'Specialist ↔ Specialist (A2A)'}
        </span>
      </div>
    </div>
  );
}

function AgentIcon({ id }: { id: NodeSpec['id'] }) {
  const size = 13;
  const stroke = 2;
  switch (id) {
    case 'seo':       return <IconSearch size={size} stroke={stroke} />;
    case 'marketing': return <IconSpeakerphone size={size} stroke={stroke} />;
    case 'pricing':   return <IconCoin size={size} stroke={stroke} />;
    case 'reviews':   return <IconMessageCircle size={size} stroke={stroke} />;
    case 'cashflow':  return <IconChartBar size={size} stroke={stroke} />;
  }
}
