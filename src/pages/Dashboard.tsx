import { Plus, AlertCircle, AlertTriangle, CheckCircle, Activity, Zap, Shield, Server } from 'lucide-react';
import { useStore } from '@/store';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ModelCard from '@/components/Dashboard/ModelCard';
import AddModelModal from '@/components/Modal/AddModelModal';

export default function Dashboard() {
  const models = useStore((state) => state.models);
  const metrics = useStore((state) => state.metrics);
  const isBackendConnected = useStore((state) => state.isBackendConnected);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const healthSummary = useMemo(() => {
    const modelMetrics = models.map((model) => metrics[model.id]).filter(Boolean);
    
    if (modelMetrics.length === 0) {
      return {
        avgQualityScore: 0,
        avgResponseTime: 0,
        avgSuccessRate: 0,
        healthyCount: 0,
        warningCount: 0,
        criticalCount: 0,
        hasAlerts: false,
        alerts: [],
      };
    }

    const avgQualityScore = Math.round(
      modelMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / modelMetrics.length
    );
    const avgResponseTime = Math.round(
      modelMetrics.reduce((sum, m) => sum + m.responseTime, 0) / modelMetrics.length
    );
    const avgSuccessRate = Math.round(
      modelMetrics.reduce((sum, m) => sum + m.successRate, 0) / modelMetrics.length
    );

    const healthyCount = modelMetrics.filter((m) => m.qualityScore >= 80).length;
    const warningCount = modelMetrics.filter((m) => m.qualityScore >= 50 && m.qualityScore < 80).length;
    const criticalCount = modelMetrics.filter((m) => m.qualityScore < 50).length;

    const alerts: { modelName: string; type: string; message: string }[] = [];
    modelMetrics.forEach((m) => {
      const model = models.find((mod) => mod.id === m.modelId);
      if (!model) return;
      
      // Juice 降级趋势告警
      if (m.juiceTrend === 'degrading' && m.juiceValue) {
        alerts.push({ modelName: model.name, type: 'warning', message: `Juice值降级: ${m.juiceValue} (基准: ${m.juiceBaseline ?? '-'})` });
      }
      
      if (m.qualityScore < 50) {
        alerts.push({ modelName: model.name, type: 'critical', message: `质量分过低: ${m.qualityScore}` });
      } else if (m.successRate < 80) {
        alerts.push({ modelName: model.name, type: 'warning', message: `成功率下降: ${m.successRate}%` });
      } else if (m.juiceValue && m.juiceValue < 256) {
        alerts.push({ modelName: model.name, type: 'warning', message: `Juice值偏低: ${m.juiceValue}` });
      }
    });

    return {
      avgQualityScore,
      avgResponseTime,
      avgSuccessRate,
      healthyCount,
      warningCount,
      criticalCount,
      hasAlerts: alerts.length > 0,
      alerts,
    };
  }, [models, metrics]);

  const getOverallStatus = () => {
    if (healthSummary.criticalCount > 0) return { label: '异常', color: 'text-error-red', bg: 'bg-error-red/20' };
    if (healthSummary.warningCount > 0) return { label: '警告', color: 'text-amber-orange', bg: 'bg-amber-orange/20' };
    return { label: '健康', color: 'text-mint-green', bg: 'bg-mint-green/20' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div>
      {!isBackendConnected && (
        <div className="mb-6 p-4 bg-amber-orange/10 border border-amber-orange/30 rounded-2xl flex items-center gap-3">
          <Server className="w-5 h-5 text-amber-orange flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-orange">未连接后端服务</p>
            <p className="text-xs text-zinc-500">请先配置后端服务地址以启用完整功能</p>
          </div>
          <Link
            to="/settings"
            className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm transition-all"
          >
            去配置
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">监控面板</h1>
          <p className="text-sm text-zinc-500">
            实时监测 {models.length} 个模型的服务质量
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-accent/25"
        >
          <Plus className="w-4 h-4" />
          添加模型
        </button>
      </div>

      {models.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`bg-primary rounded-2xl p-5 border border-accent/30 ${overallStatus.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-500">整体状态</span>
              {healthSummary.hasAlerts ? (
                <AlertTriangle className={`w-5 h-5 ${overallStatus.color}`} />
              ) : (
                <CheckCircle className="w-5 h-5 text-mint-green" />
              )}
            </div>
            <div className={`text-2xl font-semibold ${overallStatus.color}`}>
              {overallStatus.label}
            </div>
            <div className="mt-3 flex gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-mint-green/20 text-mint-green">
                {healthSummary.healthyCount} 健康
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-amber-orange/20 text-amber-orange">
                {healthSummary.warningCount} 警告
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-error-red/20 text-error-red">
                {healthSummary.criticalCount} 异常
              </span>
            </div>
          </div>

          <div className="bg-primary rounded-2xl p-5 border border-accent/30">
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
              <Activity className="w-4 h-4" />
              平均质量分
            </div>
            <div className={`text-2xl font-semibold ${
              healthSummary.avgQualityScore >= 80 ? 'text-mint-green' :
              healthSummary.avgQualityScore >= 50 ? 'text-amber-orange' : 'text-error-red'
            }`}>
              {healthSummary.avgQualityScore}
            </div>
          </div>

          <div className="bg-primary rounded-2xl p-5 border border-accent/30">
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
              <Zap className="w-4 h-4" />
              平均响应时间
            </div>
            <div className="text-2xl font-semibold text-sky-blue">
              {healthSummary.avgResponseTime}
              <span className="text-sm font-normal text-zinc-500 ml-1">ms</span>
            </div>
          </div>

          <div className="bg-primary rounded-2xl p-5 border border-accent/30">
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
              <Shield className="w-4 h-4" />
              平均成功率
            </div>
            <div className={`text-2xl font-semibold ${
              healthSummary.avgSuccessRate >= 95 ? 'text-mint-green' :
              healthSummary.avgSuccessRate >= 80 ? 'text-amber-orange' : 'text-error-red'
            }`}>
              {healthSummary.avgSuccessRate}
              <span className="text-sm font-normal text-zinc-500 ml-1">%</span>
            </div>
          </div>
        </div>
      )}

      {healthSummary.hasAlerts && models.length > 0 && (
        <div className="bg-primary rounded-2xl p-5 border border-error-red/30 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-error-red" />
            <span className="font-semibold">告警通知</span>
            <span className="text-xs text-zinc-500">({healthSummary.alerts.length})</span>
          </div>
          <div className="space-y-2">
            {healthSummary.alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  alert.type === 'critical' ? 'bg-error-red/10' : 'bg-amber-orange/10'
                }`}
              >
                {alert.type === 'critical' ? (
                  <AlertCircle className="w-4 h-4 text-error-red flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-orange flex-shrink-0" />
                )}
                <span className="text-sm">
                  <span className="font-medium">{alert.modelName}</span>
                  <span className="text-zinc-500 ml-2">{alert.message}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {models.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/30 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-zinc-500" />
          </div>
          <h2 className="text-xl font-medium mb-2">暂无监控模型</h2>
          <p className="text-zinc-500 mb-6 max-w-md">
            添加您想要监控的 LLM 模型，系统将自动收集质量指标数据
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-sky-blue hover:bg-sky-blue/90 text-primary font-medium rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            添加第一个模型
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model, index) => (
            <div
              key={model.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ModelCard model={model} />
            </div>
          ))}
        </div>
      )}

      <AddModelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
