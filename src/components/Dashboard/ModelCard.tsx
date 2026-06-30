import { Trash2, ExternalLink } from 'lucide-react';
import { useStore } from '@/store';
import type { ModelConfig } from '@/types';
import BusyIndicator from './BusyIndicator';
import MiniChart from './MiniChart';

interface ModelCardProps {
  model: ModelConfig;
}

export default function ModelCard({ model }: ModelCardProps) {
  const metrics = useStore((state) => state.metrics[model.id]);
  const removeModel = useStore((state) => state.removeModel);

  const handleDelete = () => {
    if (confirm(`确定要删除模型 "${model.name}" 吗？`)) {
      removeModel(model.id);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-primary rounded-2xl p-5 border border-accent/30 hover:border-accent/60 transition-all duration-300 hover:shadow-xl hover:shadow-accent/10 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold truncate">{model.name}</h3>
            {metrics && metrics.history.length > 0 && <BusyIndicator level={metrics.busyLevel} />}
          </div>
          {model.apiDocUrl && (
            <a
              href={model.apiDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-sky-blue transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              API 文档
            </a>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="p-2 rounded-lg text-zinc-600 hover:text-error-red hover:bg-error-red/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {metrics && metrics.history.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-background/50 rounded-xl p-3">
              <div className="text-xs text-zinc-500 mb-1">响应时间</div>
              <div className="font-mono text-lg font-semibold text-sky-blue">
                {metrics.responseTime}
                <span className="text-xs ml-1 text-zinc-500">ms</span>
              </div>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <div className="text-xs text-zinc-500 mb-1">成功率</div>
              <div className={`font-mono text-lg font-semibold ${
                metrics.successRate >= 95 ? 'text-mint-green' :
                metrics.successRate >= 80 ? 'text-amber-orange' : 'text-error-red'
              }`}>
                {metrics.successRate}
                <span className="text-xs ml-1 text-zinc-500">%</span>
              </div>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <div className="text-xs text-zinc-500 mb-1">错误率</div>
              <div className={`font-mono text-lg font-semibold ${
                metrics.errorRate <= 5 ? 'text-mint-green' :
                metrics.errorRate <= 20 ? 'text-amber-orange' : 'text-error-red'
              }`}>
                {metrics.errorRate}
                <span className="text-xs ml-1 text-zinc-500">%</span>
              </div>
            </div>
          </div>

          <div className="bg-background/30 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>响应时间趋势</span>
              <span>最近 {metrics.history.length} 次</span>
            </div>
            <MiniChart data={metrics.history} />
          </div>

          <div className="mt-3 text-xs text-zinc-600 text-right">
            最后更新: {formatTime(metrics.lastUpdated)}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-32 text-zinc-500">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-sky-blue rounded-full animate-spin mx-auto mb-2" />
            <span>等待首次采样...</span>
          </div>
        </div>
      )}
    </div>
  );
}
