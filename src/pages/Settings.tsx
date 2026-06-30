import { Key, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/store';
import type { Provider } from '@/types';

const providers: { value: Provider; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'custom', label: '自定义' },
];

export default function Settings() {
  const apiKeys = useStore((state) => state.apiKeys);
  const addApiKey = useStore((state) => state.addApiKey);
  const removeApiKey = useStore((state) => state.removeApiKey);
  const samplingInterval = useStore((state) => state.samplingInterval);
  const setSamplingInterval = useStore((state) => state.setSamplingInterval);

  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newProvider, setNewProvider] = useState<Provider>('openai');
  const [newKey, setNewKey] = useState('');

  const handleAddKey = () => {
    if (!newLabel.trim() || !newKey.trim()) return;
    addApiKey({
      label: newLabel.trim(),
      provider: newProvider,
      key: newKey.trim(),
    });
    setNewLabel('');
    setNewKey('');
    setIsAdding(false);
  };

  const handleDeleteKey = (id: string, label: string) => {
    if (confirm(`确定要删除 API Key "${label}" 吗？`)) {
      removeApiKey(id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">设置</h1>
        <p className="text-sm text-zinc-500">配置 API Key 和监控参数</p>
      </div>

      {/* API Keys Section */}
      <section className="bg-primary rounded-2xl p-6 border border-accent/30 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center">
              <Key className="w-5 h-5 text-sky-blue" />
            </div>
            <div>
              <h2 className="font-semibold">API Keys</h2>
              <p className="text-xs text-zinc-500">管理您的 AI 服务商 API Key</p>
            </div>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          )}
        </div>

        {apiKeys.length === 0 && !isAdding ? (
          <div className="text-center py-8 text-zinc-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>暂无 API Key，请先添加</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-background/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-mint-green" />
                  <div>
                    <div className="font-medium">{key.label}</div>
                    <div className="text-xs text-zinc-500">{key.provider}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteKey(key.id, key.label)}
                  className="p-2 rounded-lg text-zinc-600 hover:text-error-red hover:bg-error-red/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {isAdding && (
          <div className="mt-4 p-4 bg-background/30 rounded-xl border border-accent/30">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  名称
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="例如：我的 OpenAI Key"
                  className="w-full px-4 py-3 bg-primary rounded-xl border border-accent/50 focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  服务商
                </label>
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value as Provider)}
                  className="w-full px-4 py-3 bg-primary rounded-xl border border-accent/50 focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none transition-all"
                >
                  {providers.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 bg-primary rounded-xl border border-accent/50 focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none transition-all font-mono"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewLabel('');
                    setNewKey('');
                  }}
                  className="flex-1 px-4 py-3 bg-accent/50 hover:bg-accent text-white rounded-xl transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAddKey}
                  disabled={!newLabel.trim() || !newKey.trim()}
                  className="flex-1 px-4 py-3 bg-sky-blue hover:bg-sky-blue/90 text-primary font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Sampling Interval Section */}
      <section className="bg-primary rounded-2xl p-6 border border-accent/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center">
            <svg className="w-5 h-5 text-sky-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold">采样间隔</h2>
            <p className="text-xs text-zinc-500">控制检测频率，默认 30 秒</p>
          </div>
        </div>

        <div className="space-y-4">
          {[15000, 30000, 60000, 120000].map((interval) => (
            <label
              key={interval}
              className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                samplingInterval === interval
                  ? 'bg-sky-blue/10 border border-sky-blue/50'
                  : 'bg-background/50 border border-transparent hover:border-accent/50'
              }`}
            >
              <span className="font-medium">
                {interval / 1000} 秒
              </span>
              <input
                type="radio"
                name="samplingInterval"
                value={interval}
                checked={samplingInterval === interval}
                onChange={() => setSamplingInterval(interval)}
                className="sr-only"
              />
              {samplingInterval === interval && (
                <CheckCircle className="w-5 h-5 text-sky-blue" />
              )}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
