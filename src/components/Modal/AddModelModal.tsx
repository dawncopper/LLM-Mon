import { X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/store';

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddModelModal({ isOpen, onClose }: AddModelModalProps) {
  const [name, setName] = useState('');
  const [apiDocUrl, setApiDocUrl] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKeyId, setApiKeyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const apiKeys = useStore((state) => state.apiKeys);
  const addModel = useStore((state) => state.addModel);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !apiEndpoint.trim() || !apiKeyId) return;

    setIsLoading(true);
    try {
      addModel({
        name: name.trim(),
        apiDocUrl: apiDocUrl.trim(),
        apiEndpoint: apiEndpoint.trim(),
        apiKeyId,
      });
      setName('');
      setApiDocUrl('');
      setApiEndpoint('');
      setApiKeyId('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-primary rounded-2xl p-6 w-full max-w-md mx-4 border border-accent/50 shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">添加监控模型</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-accent/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              模型名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：GPT-4"
              className="w-full px-4 py-3 bg-background rounded-xl border border-accent/50 focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              <ExternalLink className="w-4 h-4 inline mr-1" />
              API 文档地址（可选）
            </label>
            <input
              type="url"
              value={apiDocUrl}
              onChange={(e) => setApiDocUrl(e.target.value)}
              placeholder="https://platform.openai.com/docs/"
              className="w-full px-4 py-3 bg-background rounded-xl border border-accent/50 focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              API 端点
            </label>
            <input
              type="url"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="w-full px-4 py-3 bg-background rounded-xl border border-accent/50 focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              选择 API Key
            </label>
            <select
              value={apiKeyId}
              onChange={(e) => setApiKeyId(e.target.value)}
              className="w-full px-4 py-3 bg-background rounded-xl border border-accent/50 focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none transition-all"
              required
            >
              <option value="">请选择...</option>
              {apiKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.label} ({key.provider})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-accent/50 hover:bg-accent text-white rounded-xl transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim() || !apiEndpoint.trim() || !apiKeyId}
              className="flex-1 px-4 py-3 bg-sky-blue hover:bg-sky-blue/90 text-primary font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '添加中...' : '添加模型'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
