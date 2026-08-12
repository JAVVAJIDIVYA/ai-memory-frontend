'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Image, Link, Mic, PlayCircle, Type, BarChart2, PieChart, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';

type StatsData = Record<string, number>;
type ChartType = 'bar' | 'pie' | 'line';

interface TooltipState {
  x: number;
  y: number;
  label: string;
  count: number;
  pct: number;
  color: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; gradientFrom: string; gradientTo: string; Icon: React.ElementType }
> = {
  pdf: {
    label: 'PDFs',
    color: '#6366f1',
    gradientFrom: '#6366f1',
    gradientTo: '#4f46e5',
    Icon: FileText,
  },
  image: {
    label: 'Images',
    color: '#10b981',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
    Icon: Image,
  },
  link: {
    label: 'URLs',
    color: '#3b82f6',
    gradientFrom: '#60a5fa',
    gradientTo: '#3b82f6',
    Icon: Link,
  },
  voice: {
    label: 'Audio',
    color: '#f59e0b',
    gradientFrom: '#fbbf24',
    gradientTo: '#d97706',
    Icon: Mic,
  },
  youtube: {
    label: 'YouTube',
    color: '#f43f5e',
    gradientFrom: '#fb7185',
    gradientTo: '#e11d48',
    Icon: PlayCircle,
  },
  text: {
    label: 'Text',
    color: '#8b5cf6',
    gradientFrom: '#a78bfa',
    gradientTo: '#7c3aed',
    Icon: Type,
  },
};

const FALLBACK_CONFIG = {
  label: 'Other',
  color: '#94a3b8',
  gradientFrom: '#94a3b8',
  gradientTo: '#64748b',
  Icon: FileText,
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? { ...FALLBACK_CONFIG, label: type };
}

// ─── Shared Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ tip }: { tip: TooltipState | null }) {
  if (!tip) return null;
  return (
    <AnimatePresence>
      <motion.div
        key={`${tip.x}-${tip.y}`}
        initial={{ opacity: 0, scale: 0.85, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'absolute',
          left: tip.x,
          top: tip.y,
          transform: 'translate(-50%, -110%)',
          pointerEvents: 'none',
          zIndex: 50,
          background: 'rgba(15,12,41,0.92)',
          border: `1.5px solid ${tip.color}55`,
          borderRadius: 10,
          padding: '7px 12px',
          minWidth: 100,
          boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px ${tip.color}22`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: 3,
              backgroundColor: tip.color,
              flexShrink: 0,
              boxShadow: `0 0 6px ${tip.color}88`,
            }}
          />
          <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>
            {tip.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <span style={{ color: tip.color, fontSize: 18, fontWeight: 800, fontFamily: 'Inter,sans-serif', lineHeight: 1 }}>
            {tip.count}
          </span>
          <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'Inter,sans-serif' }}>
            {tip.pct}%
          </span>
        </div>
        {/* Arrow */}
        <div style={{
          position: 'absolute',
          bottom: -7,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `7px solid ${tip.color}55`,
        }} />
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bar Chart
// ─────────────────────────────────────────────────────────────────────────────
function BarChartView({
  entries, maxCount, totalUploads,
}: { entries: [string, number][]; maxCount: number; totalUploads: number }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const CHART_H = 200;
  const BAR_W = 40;
  const BAR_GAP = 24;
  const PADDING_LEFT = 40;
  const PADDING_TOP = 16;
  const LABEL_AREA = 56;

  const chartWidth = PADDING_LEFT + entries.length * (BAR_W + BAR_GAP) + BAR_GAP;
  const ticks = maxCount <= 5
    ? Array.from({ length: maxCount + 1 }, (_, i) => i)
    : [0, Math.round(maxCount * 0.25), Math.round(maxCount * 0.5), Math.round(maxCount * 0.75), maxCount];

  return (
    <div className="overflow-x-auto w-full" style={{ position: 'relative' }}>
      <div style={{ minWidth: chartWidth + 20, position: 'relative' }}>
        <ChartTooltip tip={tooltip} />
        <svg
          width="100%"
          viewBox={`0 0 ${chartWidth} ${CHART_H + LABEL_AREA + PADDING_TOP}`}
          style={{ overflow: 'visible', height: CHART_H + LABEL_AREA + PADDING_TOP + 8 }}
        >
          <defs>
            {entries.map(([type]) => {
              const cfg = getConfig(type);
              return (
                <linearGradient key={`grad-${type}`} id={`bar-grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.gradientFrom} stopOpacity="1" />
                  <stop offset="100%" stopColor={cfg.gradientTo} stopOpacity="0.75" />
                </linearGradient>
              );
            })}
          </defs>

          {/* Y-axis line */}
          <line
            x1={PADDING_LEFT} y1={PADDING_TOP}
            x2={PADDING_LEFT} y2={CHART_H + PADDING_TOP}
            stroke="#e2e8f0" strokeWidth="1.5"
          />

          {/* Grid lines + Y-axis labels */}
          {ticks.map((tick) => {
            const y = PADDING_TOP + CHART_H - (tick / maxCount) * CHART_H;
            return (
              <g key={tick}>
                <line
                  x1={PADDING_LEFT} y1={y}
                  x2={chartWidth - BAR_GAP / 2} y2={y}
                  stroke="#e2e8f0" strokeWidth="1"
                  strokeDasharray={tick === 0 ? '0' : '5,4'}
                />
                <text x={PADDING_LEFT - 8} y={y + 4} fontSize="11" fill="#94a3b8"
                  textAnchor="end" fontFamily="Inter, sans-serif">{tick}</text>
              </g>
            );
          })}

          {/* Bars */}
          {entries.map(([type, count], i) => {
            const cfg = getConfig(type);
            const barH = Math.max((count / maxCount) * CHART_H, 6);
            const x = PADDING_LEFT + BAR_GAP + i * (BAR_W + BAR_GAP);
            const y = PADDING_TOP + CHART_H - barH;
            const pct = Math.round((count / totalUploads) * 100);

            return (
              <g
                key={type}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const svgEl = (e.currentTarget as SVGGElement).closest('svg')!;
                  const svgRect = svgEl.getBoundingClientRect();
                  const parentRect = svgEl.parentElement!.getBoundingClientRect();
                  const svgW = svgRect.width;
                  const vbW = chartWidth;
                  const scale = svgW / vbW;
                  const tipX = (x + BAR_W / 2) * scale;
                  const tipY = y * scale;
                  setTooltip({ x: tipX, y: tipY - 4, label: cfg.label, count, pct, color: cfg.color });
                  void parentRect; // silence unused warning
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Hover hit zone (invisible, full height) */}
                <rect
                  x={x - 6} y={PADDING_TOP}
                  width={BAR_W + 12} height={CHART_H + LABEL_AREA}
                  fill="transparent"
                />
                {/* Background bar track */}
                <rect
                  x={x} y={PADDING_TOP}
                  width={BAR_W} height={CHART_H}
                  rx={8} fill={cfg.color} fillOpacity="0.06"
                />
                {/* Animated bar */}
                <motion.rect
                  x={x} width={BAR_W} rx={8} ry={8}
                  fill={`url(#bar-grad-${type})`}
                  initial={{ y: PADDING_TOP + CHART_H, height: 0 }}
                  animate={{ y, height: barH }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ filter: `drop-shadow(0 4px 12px ${cfg.color}55)` }}
                />
                {/* Count on top */}
                <motion.text
                  x={x + BAR_W / 2}
                  textAnchor="middle" fontSize="13" fontWeight="700"
                  fill={cfg.color} fontFamily="Inter, sans-serif"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: y - 8 }}
                  transition={{ duration: 0.4, delay: i * 0.1 + 0.5 }}
                >
                  {count}
                </motion.text>
                {/* Label below axis */}
                <text
                  x={x + BAR_W / 2} y={PADDING_TOP + CHART_H + 20}
                  textAnchor="middle" fontSize="12" fill="#64748b"
                  fontWeight="600" fontFamily="Inter, sans-serif"
                >
                  {cfg.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pie Chart
// ─────────────────────────────────────────────────────────────────────────────
function PieChartView({ entries, totalUploads }: { entries: [string, number][]; totalUploads: number }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const CX = 130;
  const CY = 130;
  const R = 100;
  const INNER_R = 56;

  let cumAngle = -Math.PI / 2;
  const slices = entries.map(([type, count]) => {
    const cfg = getConfig(type);
    const rawAngle = (count / totalUploads) * 2 * Math.PI;
    const angle = rawAngle >= 2 * Math.PI ? 2 * Math.PI - 0.0001 : rawAngle;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const midAngle = (startAngle + endAngle) / 2;


    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);
    const y2 = CY + R * Math.sin(endAngle);
    const xi1 = CX + INNER_R * Math.cos(endAngle);
    const yi1 = CY + INNER_R * Math.sin(endAngle);
    const xi2 = CX + INNER_R * Math.cos(startAngle);
    const yi2 = CY + INNER_R * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi1} ${yi1}`,
      `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${xi2} ${yi2}`,
      'Z',
    ].join(' ');

    // Tooltip anchor point: midpoint on outer edge
    const tooltipR = R + 10;
    const tx = CX + tooltipR * Math.cos(midAngle);
    const ty = CY + tooltipR * Math.sin(midAngle);

    return { type, count, cfg, d, midAngle, tx, ty, angle };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
      <div className="flex-shrink-0" style={{ position: 'relative' }}>
        <ChartTooltip tip={tooltip} />
        <svg
          width="260" height="260"
          viewBox="0 0 260 260"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {slices.map(({ type, cfg }) => (
              <radialGradient key={`pie-grad-${type}`} id={`pie-grad-${type}`} cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor={cfg.gradientFrom} stopOpacity="1" />
                <stop offset="100%" stopColor={cfg.gradientTo} stopOpacity="0.85" />
              </radialGradient>
            ))}
          </defs>

          {slices.map(({ type, d, cfg, tx, ty, count }, i) => {
            const pct = Math.round((count / totalUploads) * 100);
            const isHovered = hoveredType === type;
            return (
              <motion.path
                key={type}
                d={d}
                fill={`url(#pie-grad-${type})`}
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: isHovered ? 1.06 : 1,
                  opacity: 1,
                  filter: isHovered ? `drop-shadow(0 6px 16px ${cfg.color}88)` : `drop-shadow(0 4px 8px ${cfg.color}44)`,
                }}
                transition={{ duration: isHovered ? 0.15 : 0.5, delay: isHovered ? 0 : i * 0.08, ease: isHovered ? 'easeOut' : 'easeOut' }}
                style={{ transformOrigin: `${CX}px ${CY}px`, cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  setHoveredType(type);
                  const svgRect = (e.currentTarget as SVGPathElement).closest('svg')!.getBoundingClientRect();
                  const parentRect = (e.currentTarget as SVGPathElement).closest('div')!.getBoundingClientRect();
                  const scale = svgRect.width / 260;
                  setTooltip({
                    x: tx * scale,
                    y: ty * scale,
                    label: cfg.label, count, pct, color: cfg.color,
                  });
                  void parentRect;
                }}
                onMouseLeave={() => { setHoveredType(null); setTooltip(null); }}
              />
            );
          })}

          {/* Center total */}
          <text x={CX} y={CY - 8} textAnchor="middle" fontSize="28"
            fontWeight="800" fill="#1e293b" fontFamily="Inter, sans-serif">
            {totalUploads}
          </text>
          <text x={CX} y={CY + 14} textAnchor="middle" fontSize="12"
            fill="#94a3b8" fontFamily="Inter, sans-serif" fontWeight="500">
            total items
          </text>
        </svg>
      </div>

      {/* Pie Legend */}
      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
        {slices.map(({ type, count, cfg }) => {
          const pct = Math.round((count / totalUploads) * 100);
          const isHovered = hoveredType === type;
          return (
            <motion.div
              key={type}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredType(type)}
              onMouseLeave={() => setHoveredType(null)}
            >
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0 transition-all duration-150"
                style={{
                  backgroundColor: cfg.color,
                  boxShadow: isHovered ? `0 0 10px ${cfg.color}88` : `0 2px 6px ${cfg.color}55`,
                  transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span
                    className="text-sm font-semibold truncate transition-colors duration-150"
                    style={{ color: isHovered ? cfg.color : '#374151' }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: cfg.color }}>
                    {count} <span className="text-gray-400 font-normal">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Line Chart
// ─────────────────────────────────────────────────────────────────────────────
function LineChartView({
  entries, maxCount, totalUploads,
}: { entries: [string, number][]; maxCount: number; totalUploads: number }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const CHART_H = 200;
  const PADDING_LEFT = 44;
  const PADDING_RIGHT = 24;
  const PADDING_TOP = 16;
  const LABEL_AREA = 56;
  const CHART_W = Math.max(entries.length * 90, 300);

  const ticks = maxCount <= 5
    ? Array.from({ length: maxCount + 1 }, (_, i) => i)
    : [0, Math.round(maxCount * 0.25), Math.round(maxCount * 0.5), Math.round(maxCount * 0.75), maxCount];

  const totalW = PADDING_LEFT + CHART_W + PADDING_RIGHT;

  const points = entries.map(([type, count], i) => {
    const x = PADDING_LEFT + (entries.length === 1 ? CHART_W / 2 : (i / (entries.length - 1)) * CHART_W);
    const y = PADDING_TOP + CHART_H - (count / maxCount) * CHART_H;
    return { x, y, type, count };
  });

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${PADDING_TOP + CHART_H} L ${points[0].x} ${PADDING_TOP + CHART_H} Z`
    : '';

  return (
    <div className="overflow-x-auto w-full" style={{ position: 'relative' }}>
      <div style={{ minWidth: totalW, position: 'relative' }}>
        <ChartTooltip tip={tooltip} />
        <svg
          width="100%"
          viewBox={`0 0 ${totalW} ${CHART_H + LABEL_AREA + PADDING_TOP}`}
          style={{ overflow: 'visible', height: CHART_H + LABEL_AREA + PADDING_TOP + 8 }}
        >
          <defs>
            <linearGradient id="line-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
            </linearGradient>
            {points.map(({ type }) => {
              const cfg = getConfig(type);
              return (
                <radialGradient key={`dot-grad-${type}`} id={`dot-grad-${type}`} cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor={cfg.gradientFrom} />
                  <stop offset="100%" stopColor={cfg.gradientTo} />
                </radialGradient>
              );
            })}
          </defs>

          {/* Y-axis */}
          <line
            x1={PADDING_LEFT} y1={PADDING_TOP}
            x2={PADDING_LEFT} y2={CHART_H + PADDING_TOP}
            stroke="#e2e8f0" strokeWidth="1.5"
          />

          {/* Grid lines */}
          {ticks.map((tick) => {
            const y = PADDING_TOP + CHART_H - (tick / maxCount) * CHART_H;
            return (
              <g key={tick}>
                <line
                  x1={PADDING_LEFT} y1={y}
                  x2={totalW - PADDING_RIGHT} y2={y}
                  stroke="#e2e8f0" strokeWidth="1"
                  strokeDasharray={tick === 0 ? '0' : '5,4'}
                />
                <text x={PADDING_LEFT - 8} y={y + 4} fontSize="11" fill="#94a3b8"
                  textAnchor="end" fontFamily="Inter, sans-serif">{tick}</text>
              </g>
            );
          })}

          {/* Area fill */}
          {points.length >= 2 && (
            <motion.path
              d={areaD} fill="url(#line-area-grad)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          )}

          {/* Line path */}
          {points.length >= 2 && (
            <motion.path
              d={pathD} fill="none"
              stroke="#6366f1" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />
          )}

          {/* Dots + hover areas */}
          {points.map(({ x, y, type, count }, i) => {
            const cfg = getConfig(type);
            const pct = Math.round((count / totalUploads) * 100);
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={type}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  setHoveredIdx(i);
                  const svgEl = (e.currentTarget as SVGGElement).closest('svg')!;
                  const svgRect = svgEl.getBoundingClientRect();
                  const scale = svgRect.width / totalW;
                  setTooltip({ x: x * scale, y: y * scale, label: cfg.label, count, pct, color: cfg.color });
                }}
                onMouseLeave={() => { setHoveredIdx(null); setTooltip(null); }}
              >
                {/* Large invisible hit area */}
                <rect
                  x={x - 20} y={PADDING_TOP}
                  width={40} height={CHART_H + LABEL_AREA}
                  fill="transparent"
                />
                {/* Glow ring – grows on hover */}
                <motion.circle
                  cx={x} cy={y}
                  r={isHovered ? 20 : 14}
                  fill={cfg.color}
                  fillOpacity={isHovered ? 0.2 : 0.12}
                  animate={{ r: isHovered ? 20 : 14 }}
                  transition={{ duration: 0.2 }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
                {/* Main dot – grows on hover */}
                <motion.circle
                  cx={x} cy={y}
                  r={isHovered ? 11 : 8}
                  fill={`url(#dot-grad-${type})`}
                  stroke="white" strokeWidth="2.5"
                  animate={{ r: isHovered ? 11 : 8 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    transformOrigin: `${x}px ${y}px`,
                    filter: `drop-shadow(0 3px 8px ${cfg.color}${isHovered ? '99' : '66'})`,
                  }}
                />
                {/* Count above dot */}
                <motion.text
                  x={x} y={y - 16}
                  textAnchor="middle" fontSize="12" fontWeight="700"
                  fill={cfg.color} fontFamily="Inter, sans-serif"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 + 0.9 }}
                >
                  {count}
                </motion.text>
                {/* Label below axis */}
                <text
                  x={x} y={PADDING_TOP + CHART_H + 20}
                  textAnchor="middle" fontSize="12"
                  fill={isHovered ? cfg.color : '#64748b'}
                  fontWeight="600" fontFamily="Inter, sans-serif"
                  style={{ transition: 'fill 0.15s' }}
                >
                  {cfg.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const CHART_TABS: { type: ChartType; label: string; Icon: React.ElementType }[] = [
  { type: 'bar', label: 'Bar', Icon: BarChart2 },
  { type: 'pie', label: 'Pie', Icon: PieChart },
  { type: 'line', label: 'Line', Icon: TrendingUp },
];

export default function UploadStatsChart() {
  const [chartType, setChartType] = useState<ChartType>('bar');

  const { data: stats = {}, isLoading } = useQuery<StatsData>({
    queryKey: ['notes-stats'],
    queryFn: async () => {
      const res = await api.get<StatsData>('/notes/stats');
      return res.data;
    },
    retry: false,
  });

  const entries = Object.entries(stats).filter(([, v]) => v > 0);
  const maxCount = entries.length > 0 ? Math.max(...entries.map(([, v]) => v)) : 1;
  const totalUploads = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div
      className="rounded-2xl border overflow-hidden w-full"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ borderColor: 'var(--border-light)', background: 'var(--surface-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}
          >
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Upload Breakdown
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Content by type · hover to inspect
            </p>
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full ml-2"
            style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}
          >
            {totalUploads} items
          </span>
        </div>

        {/* Chart type toggle */}
        <div
          className="flex items-center rounded-xl p-1 gap-1 self-start sm:self-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
        >
          {CHART_TABS.map(({ type, label, Icon }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: chartType === type ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                color: chartType === type ? '#ffffff' : 'var(--text-muted)',
                boxShadow: chartType === type ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[220px] gap-3">
            <div className="flex gap-2.5 items-end">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 rounded-lg animate-pulse"
                  style={{
                    height: `${20 + i * 18}px`,
                    background: 'linear-gradient(180deg, #c7d2fe, #e0e7ff)',
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading chart data…
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] gap-2" style={{ color: 'var(--text-muted)' }}>
            <BarChart2 className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">No uploads yet</p>
            <p className="text-xs opacity-70">Upload content to see your breakdown here</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={chartType}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {chartType === 'bar' && (
                <BarChartView entries={entries} maxCount={maxCount} totalUploads={totalUploads} />
              )}
              {chartType === 'pie' && (
                <PieChartView entries={entries} totalUploads={totalUploads} />
              )}
              {chartType === 'line' && (
                <LineChartView entries={entries} maxCount={maxCount} totalUploads={totalUploads} />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Legend row (bar + line) */}
        {!isLoading && entries.length > 0 && chartType !== 'pie' && (
          <div
            className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 pt-4 border-t"
            style={{ borderColor: 'var(--border-light)' }}
          >
            {entries.map(([type, count]) => {
              const cfg = getConfig(type);
              const pct = Math.round((count / totalUploads) * 100);
              return (
                <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="font-semibold">{cfg.label}</span>
                  <span style={{ color: '#d1d5db' }}>({pct}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
