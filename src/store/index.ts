import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

  addApiKey: (apiKey: Omit<ApiKeyConfig, 'id'>) => void;
  removeApiKey: (id: string) => void;
  getApiKey: (id: string) => ApiKeyConfig | undefined;

  addModel: (model: Omit<ModelConfig, 'id' | 'createdAt'>) => string;
  removeModel: (id: string) => void;

  recordMetric: (modelId: string, responseTime: number, success: boolean) => void;
  setSamplingInterval: (interval: number) => void;
  setMonitoring: (isMonitoring: boolean) => void;
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

      addApiKey: (apiKey) => {
        const newApiKey: ApiKeyConfig = {
          ...apiKey,
          id: generateId(),
        };
        set((state) => ({
          apiKeys: [...state.apiKeys, newApiKey],
        }));
      },

      removeApiKey: (id) => {
        set((state) => ({
          apiKeys: state.apiKeys.filter((k) => k.id !== id),
        }));
      },

      getApiKey: (id) => {
        return get().apiKeys.find((k) => k.id === id);
      },

      addModel: (model) => {
        const id = generateId();
        const newModel: ModelConfig = {
          ...model,
          id,
          createdAt: Date.now(),
        };
        const initialMetrics: QualityMetrics = {
          modelId: id,
          responseTime: 0,
          errorRate: 0,
          successRate: 100,
          busyLevel: 'idle',
          lastUpdated: Date.now(),
          history: [],
        };
        set((state) => ({
          models: [...state.models, newModel],
          metrics: {
            ...state.metrics,
            [id]: initialMetrics,
          },
        }));
        return id;
      },

      removeModel: (id) => {
        set((state) => {
          const { [id]: _, ...restMetrics } = state.metrics;
          return {
            models: state.models.filter((m) => m.id !== id),
            metrics: restMetrics,
          };
        });
      },

      recordMetric: (modelId, responseTime, success) => {
        set((state) => {
          const currentMetrics = state.metrics[modelId];
          if (!currentMetrics) return state;

          const newHistory: HistoryEntry[] = [
            ...currentMetrics.history,
            { timestamp: Date.now(), responseTime, success },
          ].slice(-HISTORY_LIMIT);

          const totalRequests = newHistory.length;
          const failedRequests = newHistory.filter((h) => !h.success).length;
          const avgResponseTime = newHistory.reduce((sum, h) => sum + h.responseTime, 0) / totalRequests;
          const errorRate = Math.round((failedRequests / totalRequests) * 100);

          const newMetrics: QualityMetrics = {
            modelId,
            responseTime: Math.round(avgResponseTime),
            errorRate,
            successRate: 100 - errorRate,
            busyLevel: calculateBusyLevel(avgResponseTime),
            lastUpdated: Date.now(),
            history: newHistory,
          };

          return {
            metrics: {
              ...state.metrics,
              [modelId]: newMetrics,
            },
          };
        });
      },

      setSamplingInterval: (interval) => {
        set({ samplingInterval: interval });
      },

      setMonitoring: (isMonitoring) => {
        set({ isMonitoring });
      },
    }),
    {
      name: 'llm-monitor-storage',
    }
  )
);
