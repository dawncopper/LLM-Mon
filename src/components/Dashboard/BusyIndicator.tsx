import type { BusyLevel } from '@/types';

interface BusyIndicatorProps {
  level: BusyLevel;
}

const levelConfig: Record<BusyLevel, { label: string; color: string; radius: string }> = {
  idle: { label: '空闲', color: 'bg-mint-green text-mint-green', radius: 'rounded-4' },
  normal: { label: '正常', color: 'bg-sky-blue text-sky-blue', radius: 'rounded-4' },
  busy: { label: '繁忙', color: 'bg-amber-orange text-amber-orange', radius: 'rounded-8' },
  danger: { label: '危险', color: 'bg-error-red text-error-red', radius: 'rounded-12' },
};

export default function BusyIndicator({ level }: BusyIndicatorProps) {
  const config = levelConfig[level];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.radius} border border-current/20 animate-pulse-glow`}>
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}
