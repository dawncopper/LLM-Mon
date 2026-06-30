import { Plus, AlertCircle } from 'lucide-react';
import { useStore } from '@/store';
import { useState } from 'react';
import ModelCard from '@/components/Dashboard/ModelCard';
import AddModelModal from '@/components/Modal/AddModelModal';

export default function Dashboard() {
  const models = useStore((state) => state.models);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
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
