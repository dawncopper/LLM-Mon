import type { HistoryEntry } from '@/types';

interface MiniChartProps {
  data: HistoryEntry[];
}

export default function MiniChart({ data }: MiniChartProps) {
  if (data.length < 2) {
    return (
      <div className="h-12 flex items-center justify-center text-xs text-zinc-600">
        数据不足
      </div>
    );
  }

  const maxResponseTime = Math.max(...data.map((d) => d.responseTime), 1);
  const minResponseTime = Math.min(...data.map((d) => d.responseTime));
  const range = maxResponseTime - minResponseTime || 1;

  const points = data.map((entry, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((entry.responseTime - minResponseTime) / range) * 100;
    return `${x},${y}`;
  });

  const pathD = points.map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(' ');

  const areaD = `${pathD} L 100,100 L 0,100 Z`;

  return (
    <div className="relative h-12">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ fill: 'none' }}
      >
        <defs>
          <linearGradient id={`gradient-${data[0]?.timestamp}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4facfe" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4facfe" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={areaD}
          fill={`url(#gradient-${data[0]?.timestamp})`}
        />
        <path
          d={pathD}
          stroke="#4facfe"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
