import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';
import type { ApiKeyConfig, ModelConfig, QualityMetrics, BusyLevel, HistoryEntry, TestCase, TestResult } from '@/types';

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
  testCases: TestCase[];
  backendUrl: string;
  isBackendConnected: boolean;

  // Auth
  token: string | null;
  user: { id: string; email: string } | null;

  setBackendUrl: (url: string) => void;
  checkBackend: () => Promise<boolean>;

  setToken: (token: string, user: { id: string; email: string }) => void;
  clearToken: () => void;

  fetchApiKeys: () => Promise<void>;
  addApiKey: (apiKey: Omit<ApiKeyConfig, 'id'>) => Promise<void>;
  removeApiKey: (id: string) => Promise<void>;
  getApiKey: (id: string) => ApiKeyConfig | undefined;

  fetchModels: () => Promise<void>;
  addModel: (model: Omit<ModelConfig, 'id' | 'createdAt'>) => Promise<string>;
  removeModel: (id: string) => Promise<void>;

  fetchMetrics: (modelId: string) => Promise<void>;
  runMultiTest: (modelId: string) => Promise<void>;
  setSamplingInterval: (interval: number) => void;

  fetchTestCases: (modelId: string) => Promise<void>;
  addTestCase: (modelId: string, testCase: Omit<TestCase, 'id'>) => Promise<void>;
  removeTestCase: (modelId: string, id: string) => Promise<void>;
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
      testCases: [],
      backendUrl: '',
      isBackendConnected: false,

      // Auth init
      token: null,
      user: null,

      setBackendUrl: (url) => {
        set({ backendUrl: url });
      },

      setToken: (token, user) => {
        set({ token, user });
      },

      clearToken: () => {
        set({ token: null, user: null });
      },

      checkBackend: async () => {
        try {
          await api.health();
          set({ isBackendConnected: true });
          return true;
        } catch {
          set({ isBackendConnected: false });
          return false;
        }
      },

      fetchApiKeys: async () => {
        try {
          const keys = await api.getKeys();
          set({
            apiKeys: keys.map((k) => ({
              id: k.id,
              provider: k.provider,
              label: k.label,
              key: k.key || '***',
            })),
          });
        } catch (err) {
          console.error('Failed to fetch API keys:', err);
        }
      },

      addApiKey: async (apiKey) => {
        const newKey = await api.addKey({
          provider: apiKey.provider,
          key: apiKey.key,
          label: apiKey.label,
        });
        set((state) => ({
          apiKeys: [
            ...state.apiKeys,
            { id: newKey.id, provider: newKey.provider, label: newKey.label, key: '***' },
          ],
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
          set({
            models: models.map((m) => ({
              id: m.id,
              name: m.name,
              apiDocUrl: m.apiDocUrl || '',
              apiEndpoint: m.apiEndpoint,
              apiKeyId: m.apiKeyId,
              createdAt: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
            })),
            isLoading: false,
          });

          for (const model of models) {
            get().fetchMetrics(model.id);
          }
        } catch (err) {
          console.error('Failed to fetch models:', err);
          set({ isLoading: false });
        }
      },

      addModel: async (model) => {
        const newModel = await api.addModel({
          name: model.name,
          apiDocUrl: model.apiDocUrl,
          apiEndpoint: model.apiEndpoint,
          apiKeyId: model.apiKeyId,
        });
        const id = newModel.id;
        set((state) => ({
          models: [
            ...state.models,
            {
              id,
              name: newModel.name,
              apiDocUrl: (newModel as any).apiDocUrl || '',
              apiEndpoint: (newModel as any).apiEndpoint,
              apiKeyId: (newModel as any).apiKeyId,
              createdAt: Date.now(),
            },
          ],
        }));
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
          const data = await api.getMetrics(modelId);
          const currentMetrics = get().metrics[modelId];

          set((state) => ({
            metrics: {
              ...state.metrics,
              [modelId]: {
                modelId: data.modelId,
                responseTime: data.responseTime,
                errorRate: data.errorRate,
                successRate: data.successRate,
                busyLevel: calculateBusyLevel(data.responseTime),
                lastUpdated: data.lastUpdated,
                history: data.history as HistoryEntry[],
                qualityScore: data.qualityScore || 0,
                consistencyScore: data.consistencyScore || 100,
                juiceValue: data.juiceValue ?? undefined,
                juiceTrend: data.juiceTrend as 'stable' | 'degrading' | 'improving' | undefined,
                juiceBaseline: data.juiceBaseline ?? undefined,
                throughputTPS: data.throughputTPS ?? undefined,
                testResults: currentMetrics?.testResults || {},
              },
            },
          }));
        } catch (err) {
          console.error('Failed to fetch metrics:', err);
        }
      },

      runMultiTest: async (modelId) => {
        try {
          const result = await api.runTest(modelId);
          const currentMetrics = get().metrics[modelId];

          const testResultsMap: Record<string, TestResult[]> = { ...currentMetrics?.testResults };

          for (const [testId, testResult] of Object.entries(result.testResults)) {
            const entry: TestResult = {
              responseTime: testResult.responseTime,
              success: testResult.success,
              outputSnippet: testResult.outputSnippet,
              timestamp: result.timestamp,
            };
            const existing = testResultsMap[testId] || [];
            testResultsMap[testId] = [...existing, entry].slice(-20);
          }

          const history: HistoryEntry[] = currentMetrics?.history || [];
          const newHistoryEntry: HistoryEntry = {
            timestamp: result.timestamp,
            responseTime: result.responseTime,
            success: result.successRate > 0,
          };
          const finalHistory = [...history, newHistoryEntry].slice(-HISTORY_LIMIT);

          const responseTimes = finalHistory.filter((h) => h.success).map((h) => h.responseTime);
          let consistencyScore = 100;
          if (responseTimes.length >= 2) {
            const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const variance =
              responseTimes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / responseTimes.length;
            const stdDev = Math.sqrt(variance);
            const cv = mean > 0 ? stdDev / mean : 0;
            consistencyScore = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
          }

          let speedScore = 25;
          if (result.responseTime < 1000) speedScore = 100;
          else if (result.responseTime < 3000) speedScore = 75;
          else if (result.responseTime < 5000) speedScore = 50;

          const qualityScore = Math.round(
            result.successRate * 0.4 + consistencyScore * 0.3 + speedScore * 0.3
          );

          set((state) => ({
            metrics: {
              ...state.metrics,
              [modelId]: {
                modelId,
                responseTime: result.responseTime,
                errorRate: result.errorRate,
                successRate: result.successRate,
                busyLevel: calculateBusyLevel(result.responseTime),
                lastUpdated: result.timestamp,
                history: finalHistory,
                qualityScore,
                consistencyScore,
                juiceValue: result.juiceValue ?? undefined,
                juiceTrend: (result as any).juiceTrend as 'stable' | 'degrading' | 'improving' | undefined,
                juiceBaseline: (result as any).juiceBaseline ?? undefined,
                throughputTPS: (result as any).throughputTPS ?? undefined,
                testResults: testResultsMap,
              },
            },
          }));
        } catch (err) {
          console.error('Failed to run test:', err);
        }
      },

      setSamplingInterval: (interval) => {
        set({ samplingInterval: interval });
      },

      fetchTestCases: async (modelId) => {
        try {
          const cases = await api.getTestCases(modelId);
          set({ testCases: cases });
        } catch (err) {
          console.error('Failed to fetch test cases:', err);
        }
      },

      addTestCase: async (modelId, testCase) => {
        const newCase = await api.addTestCase(modelId, {
          name: testCase.name,
          prompt: testCase.prompt,
          category: testCase.category,
        });
        set((state) => ({
          testCases: [...state.testCases, newCase as TestCase],
        }));
      },

      removeTestCase: async (modelId, id) => {
        await api.deleteTestCase(modelId, id);
        set((state) => ({
          testCases: state.testCases.filter((tc) => tc.id !== id),
        }));
      },
    }),
    {
      name: 'llm-monitor-storage',
      partialize: (state) => ({
        samplingInterval: state.samplingInterval,
        isMonitoring: state.isMonitoring,
        backendUrl: state.backendUrl,
        token: state.token,
        user: state.user,
      }),
    }
  )
);
