import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';
import type { ApiKeyConfig, ModelConfig, QualityMetrics, BusyLevel, HistoryEntry } from '@/types';

const HISTORY_LIMIT = 100;
const DEFAULT_SAMPLING_INTERVAL = 30000;

function calculateBusyLevel(responseTime: number): BusyLevel {
  if (responseTime < 500) return 'idle';
  if (responseTime < 2000) return 'normal';
  if (responseTime < 5000) return 'busy';
  return 'danger';
}

interface AppStore {
  apiKeys: ApiKeyConfig[];
  models: ModelConfig[];
  metrics: Record<string, QualityMetrics>;
  samplingInterval: number;
  isMonitoring: boolean;
  isLoading: boolean;

  // Actions
  fetchApiKeys: () => Promise<void>;
  addApiKey: (apiKey: Omit<ApiKeyConfig, 'id'>) => Promise<void>;
  removeApiKey: (id: string) => Promise<void>;
  getApiKey: (id: string) => ApiKeyConfig | undefined;

  fetchModels: () => Promise<void>;
  addModel: (model: Omit<ModelConfig, 'id' | 'createdAt'>) => Promise<string>;
  removeModel: (id: string) => Promise<void>;

  fetchMetrics: (modelId: string) => Promise<void>;
  setSamplingInterval: (interval: number) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      apiKeys: [],
      models: [],
      metrics: {},
      samplingInterval: DEFAULT_SAMPLING_INTERVAL,
      isMonitoring: true,
      isLoading: false,

      fetchApiKeys: async () => {
        try {
          const keys = await api.getKeys();
          set({ apiKeys: keys });
        } catch (err) {
          console.error('Failed to fetch API keys:', err);
        }
      },

      addApiKey: async (apiKey) => {
        const newKey = await api.addKey(apiKey);
        set((state) => ({
          apiKeys: [...state.apiKeys, { ...newKey, key: '' } as ApiKeyConfig],
        }));
      },

      removeApiKey: async (id) => {
        await api.deleteKey(id);
        set((state) => ({
          apiKeys: state.apiKeys.filter((k) => k.id !== id),
        }));
      },

      getApiKey: (id) => {
        return get().apiKeys.find((k) => k.id === id);
      },

      fetchModels: async () => {
        try {
          set({ isLoading: true });
          const models = await api.getModels();
          set({ models: models as ModelConfig[], isLoading: false });
          
          // Fetch metrics for each model
          for (const model of models) {
            get().fetchMetrics(model.id);
          }
        } catch (err) {
          console.error('Failed to fetch models:', err);
          set({ isLoading: false });
        }
      },

      addModel: async (model) => {
        const newModel = await api.addModel(model);
        const id = newModel.id;
        set((state) => ({
          models: [...state.models, { ...newModel, createdAt: Date.now() } as ModelConfig],
        }));
        // Fetch initial metrics
        get().fetchMetrics(id);
        return id;
      },

      removeModel: async (id) => {
        await api.deleteModel(id);
        set((state) => {
          const { [id]: _, ...restMetrics } = state.metrics;
          return {
            models: state.models.filter((m) => m.id !== id),
            metrics: restMetrics,
          };
        });
      },

      fetchMetrics: async (modelId) => {
        try {
          const metrics = await api.getMetrics(modelId);
          const transformed: QualityMetrics = {
            modelId: metrics.modelId,
            responseTime: metrics.responseTime,
            errorRate: metrics.errorRate,
            successRate: metrics.successRate,
            busyLevel: metrics.busyLevel as BusyLevel,
            lastUpdated: metrics.lastUpdated,
            history: metrics.history.map((h) => ({
              timestamp: h.timestamp,
              responseTime: h.responseTime,
              success: h.success,
            })) as HistoryEntry[],
          };
          set((state) => ({
            metrics: {
              ...state.metrics,
              [modelId]: transformed,
            },
          }));
        } catch (err) {
          console.error('Failed to fetch metrics:', err);
        }
      },

      setSamplingInterval: (interval) => {
        set({ samplingInterval: interval });
      },
    }),
    {
      name: 'llm-monitor-storage',
    }
  )
);