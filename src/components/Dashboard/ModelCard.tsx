import { Trash2, ExternalLink, ChevronDown, ChevronUp, Zap, Activity, Shield } from 'lucide-react';
import { useStore } from '@/store';
import { useState } from 'react';
import type { ModelConfig } from '@/types';
import BusyIndicator from './BusyIndicator';
import MiniChart from './MiniChart';

interface ModelCardProps {
  model: ModelConfig;
}

export default function ModelCard({ model }: ModelCardProps) {
  const metrics = useStore((state) => state.metrics[model.id]);
  const testCases = useStore((state) => state.testCases);
  const removeModel = useStore((state) => state.removeModel);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-mint-green';
    if (score >= 70) return 'text-sky-blue';
    if (score >= 50) return 'text-amber-orange';
    return 'text-error-red';
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-background/50 rounded-xl p-3">
              <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                <Zap className="w-3 h-3" />
                响应时间
              </div>
              <div className="font-mono text-lg font-semibold text-sky-blue">
                {metrics.responseTime}
                <span className="text-xs ml-1 text-zinc-500">ms</span>
              </div>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                <Shield className="w-3 h-3" />
                成功率
              </div>
              <div className={`font-mono text-lg font-semibold ${
                metrics.successRate >= 95 ? 'text-mint-green' :
                metrics.successRate >= 80 ? 'text-amber-orange' : 'text-error-red'
              }`}>
                {metrics.successRate}
                <span className="text-xs ml-1 text-zinc-500">%</span>
              </div>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                <Activity className="w-3 h-3" />
                质量分
              </div>
              <div className={`font-mono text-lg font-semibold ${getScoreColor(metrics.qualityScore)}`}>
                {metrics.qualityScore}
              </div>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                🔥
                Juice
              </div>
              <div className={`font-mono text-lg font-semibold ${
                metrics.juiceValue && metrics.juiceValue >= 512 ? 'text-mint-green' :
                metrics.juiceValue && metrics.juiceValue >= 256 ? 'text-sky-blue' :
                metrics.juiceValue && metrics.juiceValue >= 128 ? 'text-amber-orange' :
                metrics.juiceValue ? 'text-error-red' : 'text-zinc-500'
              }`}>
                {metrics.juiceValue || '-'}
                {metrics.juiceTrend && (
                  <span className="ml-1 text-xs">
                    {metrics.juiceTrend === 'degrading' ? '📉' : metrics.juiceTrend === 'improving' ? '📈' : '➡️'}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                🚀
                吞吐
              </div>
              <div className="font-mono text-lg font-semibold text-sky-blue">
                {metrics.throughputTPS || '-'}
                <span className="text-xs ml-1 text-zinc-500">w/s</span>
              </div>
            </div>
          </div>

          <div className="bg-background/30 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>响应时间趋势</span>
              <span>最近 {metrics.history.length} 次</span>
            </div>
            <MiniChart data={metrics.history} />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
            <span>一致性: <span className={getScoreColor(metrics.consistencyScore)}>{metrics.consistencyScore}%</span></span>
            <span>错误率: <span className={metrics.errorRate <= 5 ? 'text-mint-green' : metrics.errorRate <= 20 ? 'text-amber-orange' : 'text-error-red'}>{metrics.errorRate}%</span></span>
            {metrics.juiceBaseline && (
              <span>基准线: <span className="text-sky-blue">{metrics.juiceBaseline}</span></span>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-zinc-500 hover:text-sky-blue transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                收起测试明细
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                查看测试明细
              </>
            )}
          </button>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-accent/20 space-y-2">
              {testCases.map((testCase) => {
                const results = metrics.testResults[testCase.id] || [];
                const latestResult = results[results.length - 1];
                
                return (
                  <div key={testCase.id} className="bg-background/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-zinc-400">{testCase.name}</span>
                      <span className={`text-xs font-mono ${latestResult?.success ? 'text-mint-green' : 'text-error-red'}`}>
                        {latestResult?.responseTime || '-'}ms
                      </span>
                    </div>
                    {latestResult && (
                      <div className="text-xs text-zinc-500 bg-primary/50 rounded p-2 max-h-20 overflow-y-auto">
                        {latestResult.outputSnippet || 'No output'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

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
